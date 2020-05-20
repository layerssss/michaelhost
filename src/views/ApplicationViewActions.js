import React from "react";
import gql from "graphql-tag";
import {
  Git,
  Play,
  Sync,
  Stop,
  InformationVariant,
  Delete,
  Lan,
  ConsoleLine,
} from "mdi-material-ui";
import { useHistory } from "react-router";

import useAction from "../hooks/useAction";
import Actions from "../controls/Actions";

export default React.memo(ApplicationViewActions);
function ApplicationViewActions({ applicationId }) {
  const history = useHistory();
  const composeUp = useAction(gql`
    mutation($applicationId: ID!) {
      composeUp(id: $applicationId) {
        id
      }
    }
  `);
  const composeDown = useAction(gql`
    mutation($applicationId: ID!) {
      composeDown(id: $applicationId) {
        id
      }
    }
  `);
  const composePull = useAction(gql`
    mutation($applicationId: ID!) {
      composePull(id: $applicationId) {
        id
      }
    }
  `);
  const composePS = useAction(gql`
    mutation($applicationId: ID!) {
      composePS(id: $applicationId) {
        id
      }
    }
  `);
  const composeGitFetch = useAction(gql`
    mutation($applicationId: ID!) {
      composeGitFetch(id: $applicationId) {
        id
      }
    }
  `);
  const composeDeleteApplication = useAction(
    gql`
      mutation($applicationId: ID!) {
        composeDeleteApplication(id: $applicationId) {
          id
        }
      }
    `,
    {
      refetchQueries: [
        {
          query: gql`
            {
              composeApplications {
                id
              }
            }
          `,
        },
      ],
    },
  );

  return (
    <Actions
      actions={[
        {
          icon: <Play />,
          title: "compone up",
          onClick: () => composeUp({ applicationId }),
        },
        {
          icon: <Stop />,
          title: "compone down",
          onClick: () => composeDown({ applicationId }),
        },
        {
          icon: <Sync />,
          title: "compone pull",
          onClick: () => composePull({ applicationId }),
        },
        {
          icon: <InformationVariant />,
          title: "compone ps",
          onClick: () => composePS({ applicationId }),
        },
        {
          icon: <Git />,
          title: "git fetch",
          onClick: () => composeGitFetch({ applicationId }),
        },
        {
          icon: <Delete />,
          title: "delete",
          onClick: () => {
            if (!window.confirm("Are you sure?")) return;
            composeDeleteApplication({ applicationId });
            history.push("/applications");
          },
        },
        {
          icon: <Lan />,
          title: "map port",
          href: `/applications/${applicationId}/map_port`,
        },
        {
          icon: <ConsoleLine />,
          title: "exec",
          href: `/applications/${applicationId}/exec`,
        },
        {
          icon: <ConsoleLine />,
          title: "run",
          href: `/applications/${applicationId}/run`,
        },
        {
          icon: <ConsoleLine />,
          title: "logs",
          href: `/applications/${applicationId}/logs`,
        },
      ]}
    />
  );
}
