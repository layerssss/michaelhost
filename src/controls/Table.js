import React from "react";
import _ from "lodash";
import {
  Button,
  Table as MUITable,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@material-ui/core";

export default React.memo(Table);

function Table({ columns, rows }) {
  return (
    <div
      style={{
        overflowX: "auto",
      }}
    >
      <MUITable size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column}>{column}</TableCell>
            ))}
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {(rows || _.times(5).map(() => ({}))).map(
            ({ values = [], actions = [] }, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column, columnIndex) => (
                  <TableCell key={column}>
                    {values[columnIndex] === undefined
                      ? "-"
                      : String(values[columnIndex])}
                  </TableCell>
                ))}
                <TableCell padding="none">
                  {actions.map(({ title, href, onClick }) => (
                    <Button
                      size="small"
                      key={title}
                      href={href}
                      onClick={onClick}
                      color="secondary"
                    >
                      {title}
                    </Button>
                  ))}
                </TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </MUITable>
    </div>
  );
}
