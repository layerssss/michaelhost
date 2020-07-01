import React from "react";
import gql from "graphql-tag";
import { Badge } from "@material-ui/core";
import {
  Database,
  Web,
  Console,
  CalendarClock,
  MusicClefTreble,
  Docker,
  CogBox,
} from "mdi-material-ui";

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
      <MusicClefTreble />
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

export const ContainersIcon = React.memo(function ContainersIcon() {
  const [data] = useData(gql`
    query ContainersIcon {
      containers {
        id
      }
    }
  `);

  return (
    <Badge badgeContent={data?.containers.length} color="secondary">
      <Docker />
    </Badge>
  );
});

export const ServicesIcon = React.memo(function ServicesIcon() {
  const [data] = useData(gql`
    query ServicesIcon {
      services {
        id
      }
    }
  `);

  return (
    <Badge badgeContent={data?.services.length} color="secondary">
      <CogBox />
    </Badge>
  );
});

export const VolumesIcon = React.memo(function VolumesIcon() {
  const [data] = useData(gql`
    query VolumesIcon {
      volumes {
        id
      }
    }
  `);

  return (
    <Badge badgeContent={data?.volumes.length} color="secondary">
      <Database />
    </Badge>
  );
});
