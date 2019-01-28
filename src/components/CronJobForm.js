import React from "react";
import { compose, setPropTypes } from "recompose";
import PropTypes from "prop-types";
import { FormGroup, FormControl, ControlLabel } from "react-bootstrap";

export default compose(
  setPropTypes({
    cronJob: PropTypes.shape({
      command: PropTypes.string.isRequired,
      cron: PropTypes.string.isRequired,
    }).isRequired,
  }),
)(({ cronJob }) => (
  <>
    <FormGroup>
      <ControlLabel>Command</ControlLabel>
      <FormControl name="command" defaultValue={cronJob.command} />
    </FormGroup>
    <FormGroup>
      <ControlLabel>Cron</ControlLabel>
      <FormControl name="cron" defaultValue={cronJob.cron} />
    </FormGroup>
  </>
));
