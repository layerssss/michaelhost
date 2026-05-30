import React from "react";
import gql from "graphql-tag";
import { Badge } from "@mui/material";
import {
  Database,
  Console,
  CalendarClock,
  Docker,
  ZipDisk,
  CogBox,
} from "mdi-material-ui";

import useData from "../hooks/useData";

export function TerminalsIcon() {
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
}

export function CronJobsIcon() {
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
}

export function ContainersIcon() {
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
}

export function ServicesIcon() {
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
}

export function VolumesIcon() {
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
}

export function ImagesIcon() {
  const [data] = useData(gql`
    query ImagesIcon {
      images {
        id
      }
    }
  `);

  return (
    <Badge badgeContent={data?.images.length} color="secondary">
      <ZipDisk />
    </Badge>
  );
}
