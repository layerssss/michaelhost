import React from "react";
import gql from "graphql-tag";
import { Badge } from "@material-ui/core";
import { Web, Console, Docker, CalendarClock } from "mdi-material-ui";

import useData from "../hooks/useData";

export const TerminalsIcon = React.memo(function TerminalsIcon() {
  const [data] = useData(gql`
    query TerminalsIcon {
      terminals {
        id
      }
    }
  `);

  return (
    <Badge badgeContent={data?.terminals.length} color="secondary">
      <Console />
    </Badge>
  );
});

export const HostsIcon = React.memo(function HostsIcon() {
  const [data] = useData(gql`
    query HostsIcon {
      hosts {
        id
      }
    }
  `);

  return (
    <Badge badgeContent={data?.hosts.length} color="secondary">
      <Web />
    </Badge>
  );
});

export const ApplicationsIcon = React.memo(function ApplicationsIcon() {
  const [data] = useData(gql`
    query ApplicationsIcon {
      composeApplications {
        id
      }
    }
  `);

  return (
    <Badge badgeContent={data?.composeApplications.length} color="secondary">
      <Docker />
    </Badge>
  );
});

export const CronJobsIcon = React.memo(function CronJobsIcon() {
  const [data] = useData(gql`
    query CronJobsIcon {
      cronJobs {
        id
      }
    }
  `);

  return (
    <Badge badgeContent={data?.cronJobs.length} color="secondary">
      <CalendarClock />
    </Badge>
  );
});
