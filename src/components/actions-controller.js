import React from 'react';
import GitHub from 'github-api';
import { getWorkItemRelations } from '../services/azure'
import _ from 'lodash'

export default function ActionsController() {

  const buildWorkItemUrl = (id) => {
    return 'https://dev.azure.com/' + 
      VSS.getWebContext().host.name + '/' +  // eslint-disable-line no-undef
      VSS.getWebContext().project.name + '/_workitems/edit/' + id; // eslint-disable-line no-undef
  };

  React.useEffect(() => {
    const createIssue = (id, title, body, tags = null) => {
      (async function run() {
        let isProcessed = false;
        const dataService = await VSS.getService(VSS.ServiceIds.ExtensionData); // eslint-disable-line no-undef
        const githubToken = await dataService.getValue(VSS.getWebContext().project.id + '_GITHUB_TOKEN', {scopeType: 'User'}); // eslint-disable-line no-undef
        if (githubToken) {
          const githubRepo = await dataService.getValue(VSS.getWebContext().project.id + '_GITHUB_REPO', {scopeType: 'User'}); // eslint-disable-line no-undef
          if (githubRepo) {
            const github = new GitHub({
              token: githubToken
            });
            const issues = github.getIssues(githubRepo.split('/')[0], githubRepo.split('/')[1]);
            var bodyWithRef = body + '\n\n### Reference ' + buildWorkItemUrl(id);
            const workItem = await getWorkItemRelations(VSS.getWebContext().host.name + '/' + VSS.getWebContext().project.name, id) // eslint-disable-line no-undef
            const relations = workItem.data.relations;
            if (relations && relations.length > 0) {
              bodyWithRef = bodyWithRef + '\n\n### Attachments';
              const attachedFiles = _.filter(relations, { 'rel': 'AttachedFile' });
              _.forEach(attachedFiles, function(attachment) {
                bodyWithRef = bodyWithRef + `<a href="${attachment.url}" download>${attachment.attributes.name}</a>`;
                bodyWithRef = bodyWithRef + '\n'
              });
            }
            const issue = await issues.createIssue({
              title,
              body: bodyWithRef,
              labels: tags ? tags.split('; '): []
            });
            window.open(issue.data.html_url, "_blank");
            isProcessed = true;
          }
        }
        if (!isProcessed) {
          alert('No repository configured. Please configure at Topcoder X Hub -> Settings.')
        }
      })();
    };  

    VSS.require(["TFS/WorkItemTracking/Services"], function (_WorkItemServices) { // eslint-disable-line no-undef
      // Register a listener for the work item group contribution.
      function getWorkItemFormService() {
          return _WorkItemServices.WorkItemFormService.getService();
      }

      var menuContributionHandler = (function () {
        return {
          // This is a callback that gets invoked when a user clicks the newly contributed menu item
          // The actionContext parameter contains context data surrounding the circumstances of this
          // action getting invoked.
          execute: function (actionContex) {
            getWorkItemFormService().then(function(service) {
              // Get the current values for a few of the common fields
              service.getFieldValues(["System.Id", "System.Title", "System.Description", "System.Tags"]).then(
                function (value) {
                  if (!value["System.Id"]) {
                    alert('Unable to send unsaved work items. Please save it first.');
                  }
                  else {
                    createIssue(value["System.Id"], value["System.Title"], value["System.Description"], value["System.Tags"]);
                  }
              });
            });
          }
        };
      }());
  
      VSS.register("tcx-workitem-send", menuContributionHandler); // eslint-disable-line no-undef
      VSS.notifyLoadSucceeded(); // eslint-disable-line no-undef
    });
  }, []);

  return (
    <div>
    </div>
  );
}
