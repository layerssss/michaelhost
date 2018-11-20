import React from "react";
import { Helmet } from "react-helmet";
import gql from "graphql-tag";
import { compose } from "recompose";
import { Panel, ListGroup, ListGroupItem } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import withData from "./withData.js";

export default compose(
  withData(gql`
    query {
      hostname
      hosts {
        id
        hostname
      }
      mountedApps {
        id
        name
      }
      terminals {
        id
        name
      }
    }
  `),
)(
  class Dashboard extends React.Component {
    getSections = () => {
      const { data } = this.props;

      return [
        {
          title: "Hosts",
          items: data.hosts.map(host => ({
            key: host.id,
            icon: "globe-asia",
            title: host.hostname,
          })),
        },
        {
          title: "Mounted Apps",
          items: data.mountedApps.map(mountedApp => ({
            key: mountedApp.id,
            icon: "archive",
            title: mountedApp.name,
          })),
        },
        {
          title: "Terminals",
          items: data.terminals.map(terminal => ({
            key: terminal.id,
            icon: "terminal",
            title: terminal.name,
          })),
        },
      ];
    };

    render() {
      const { data } = this.props;
      return (
        <>
          <Helmet title={data.hostname} />
          <div
            style={{
              display: "flex",
              flexFlow: "row wrap",
              margin: "0 -5px",
            }}
          >
            {this.getSections().map(section => (
              <div
                key={section.title}
                style={{
                  flex: "1 1 auto",
                  width: 400,
                  margin: "0 5px",
                }}
              >
                <Panel>
                  <Panel.Heading>{section.title}</Panel.Heading>
                  <Panel.Body>
                    <ListGroup>
                      {section.items.map(item => (
                        <ListGroupItem key={item.key}>
                          <FontAwesomeIcon icon={item.icon} />
                          {item.title}
                        </ListGroupItem>
                      ))}
                    </ListGroup>
                  </Panel.Body>
                </Panel>
              </div>
            ))}
          </div>
        </>
      );
    }
  },
);
