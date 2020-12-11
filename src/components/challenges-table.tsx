/**
 * Create view for showing the challenge list on hub and widget.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Paper from '@material-ui/core/Paper';
import get from 'lodash/get';
import find from 'lodash/find';
import { fetchChallenges } from '../services/challenges';
import { challengeUrl } from '../utils/url-utils';
import { formatDate } from '../utils/date-utils';
import { ConditionalChildren } from 'azure-devops-ui/ConditionalChildren';

const headCells = [
  { id: 'type', numeric: false, disablePadding: false, label: 'Type', allowSorting: false, hidden: false },
  { id: 'name', numeric: false, disablePadding: false, label: 'Title', allowSorting: true, hidden: false },
  { id: 'startDate', numeric: false, disablePadding: false, label: 'Start Date', allowSorting: true, hidden: false },
  { id: 'endDate', numeric: false, disablePadding: false, label: 'End Date', allowSorting: true, hidden: false },
  { id: 'phases', numeric: false, disablePadding: false, label: 'State', allowSorting: false, hidden: false },
];

function EnhancedTableHead(props: any) {
  const { classes, order, orderBy, onRequestSort } = props;
  const createSortHandler = (property: any) => (event: any) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.filter(headCell => !headCell.hidden).map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'default'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            {headCell.allowSorting && <>
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <span className={classes.visuallyHidden}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </span>
                ) : null}
              </TableSortLabel>
            </>}
            {!headCell.allowSorting && <>
              {headCell.label}
              {orderBy === headCell.id ? (
                <span className={classes.visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </span>
              ) : null}
            </>}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  paper: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 500,
  },
  name: {
    minWidth: 120,
    width: 300
  },
  type: {
    width: 120
  },
  date: {
    width: 120
  },
  state: {
    width: 200
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  },
}));

function ChallengeTable(props: any) {
  const classes = useStyles();
  const [order, setOrder] = React.useState('desc');
  const [orderBy, setOrderBy] = React.useState('updated');
  const [selected, setSelected] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [data, setData] = React.useState<any[]>([]);
  const [pageCount, setPageCount] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      try {
        const params = {
          sortBy: orderBy,
          sortOrder: order,
          status: props.status,
          page: page + 1,
          perPage: rowsPerPage
        };
        const res = await fetchChallenges(params);
        setData(res.data.map((row: any) => {
          if (row.currentPhaseNames) {
            row.phases = row.currentPhaseNames.join(', ');
          }
          return row;
        }));
        const hidePhasesColumn = (props.status !== 'Active');
        find(headCells, { id: 'phases' })!.hidden = hidePhasesColumn;
        setPageCount(+get(res, 'headers.x-total', res.data.length));
        const resPage = +get(res, 'headers.x-page');
        if (resPage !== page + 1) {
          setPage(resPage - 1);
        }
        const resRowsPerPage = +get(res, 'headers.x-per-page');
        if (rowsPerPage !== resRowsPerPage) {
          setRowsPerPage(resRowsPerPage);
        }
      } catch (e) {
        console.error(e);
        alert(`Failed to fetch challenges. ${e.message}`);
      }
    })();
  }, [page, rowsPerPage, order, orderBy, props.status]);

  const handleRequestSort = (event: any, property: any) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleClick = (_event: any, name: string) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected: any[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (_event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        <TableContainer>
          <Table
            className={classes.table}
            aria-labelledby="tableTitle"
            size='medium'
            aria-label="enhanced table"
          >
            <EnhancedTableHead
              classes={classes}
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rowCount={data.length}
            />
            <TableBody>
              {data.map((row, index) => {
                const labelId = `enhanced-table-checkbox-${index}`;
                return (
                <TableRow key={index}
                    onClick={(event) => handleClick(event, row.name)}
                    tabIndex={-1}
                    children={<>
                      <ConditionalChildren renderChildren={!headCells[0].hidden}>
                        <TableCell component="th" id={labelId} scope="row" className={classes.type}>
                          {row.type}
                        </TableCell>
                      </ConditionalChildren>
                      <ConditionalChildren renderChildren={!headCells[1].hidden}>
                        <TableCell align="left" className={classes.name}>
                          <a href={challengeUrl(row.id)} target="_blank" rel="noopener noreferrer">{row.name}</a>
                        </TableCell>
                      </ConditionalChildren>
                      <ConditionalChildren renderChildren={!headCells[2].hidden}>
                        <TableCell align="left" className={classes.date}>{formatDate(row.startDate)}</TableCell>
                      </ConditionalChildren>
                      <ConditionalChildren renderChildren={!headCells[3].hidden}>
                        <TableCell align="left" className={classes.date}>{formatDate(row.endDate)}</TableCell>
                      </ConditionalChildren>
                      <ConditionalChildren renderChildren={!headCells[4].hidden}>
                        <TableCell align="left" className={classes.state}>{row.phases}</TableCell>
                      </ConditionalChildren>
                    </>}
                    hover={true}
                  />
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={pageCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onChangePage={handleChangePage}
          onChangeRowsPerPage={handleChangeRowsPerPage}
        />
      </Paper>
    </div>
  );
}

ChallengeTable.propTypes = {
  status: PropTypes.string.isRequired
};

export default ChallengeTable;
