import React from "react";
import { compose, withState, lifecycle } from "recompose";
import { Modal, Button } from "react-bootstrap";
import jquery from "jquery";

const ConfirmDialog = compose(
  withState("onConfirm", "setOnConfirm", null),
  lifecycle({
    componentDidMount: function() {
      const { setOnConfirm } = this.props;

      jquery(document).on("click.confirm", ".btn-danger", event => {
        const buttonNode = event.currentTarget;
        if (jquery(buttonNode).attr("data-confirmed") === "yes") return;
        event.preventDefault();
        event.stopImmediatePropagation();
        setOnConfirm(() => () => {
          console.log({ buttonNode });
          jquery(buttonNode).attr("data-confirmed", "yes");
          jquery(buttonNode).trigger("click");
          jquery(buttonNode).removeAttr("data-confirmed");
        });
      });
    },
    componentWillUnmount: function() {
      jquery(document).off("click.confirm");
    },
  }),
)(({ onConfirm, setOnConfirm }) => (
  <Modal show={!!onConfirm} onHide={() => setOnConfirm(null)}>
    <Modal.Header closeButton>
      <Modal.Title>Confirmation</Modal.Title>
    </Modal.Header>
    <Modal.Body>Are you sure?</Modal.Body>
    <Modal.Footer>
      <Button
        onClick={() => {
          setOnConfirm(null);
        }}
      >
        Cancel
      </Button>
      <Button
        data-confirmed="yes"
        bsStyle="danger"
        onClick={() => {
          onConfirm();
          setOnConfirm(null);
        }}
      >
        Confirm
      </Button>
    </Modal.Footer>
  </Modal>
));

export default ConfirmDialog;
