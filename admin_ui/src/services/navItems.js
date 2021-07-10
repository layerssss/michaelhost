import React from "react";
import { Gauge, FileDocument } from "mdi-material-ui";

import {
  TerminalsIcon,
  HostsIcon,
  CronJobsIcon,
  ContainersIcon,
  VolumesIcon,
  ServicesIcon,
} from "../controls/icons";

const navItems = [
  ["dashboard", "/dashboard", <Gauge />],
  ["terminals", "/terminals", <TerminalsIcon />],
  ["hosts", "/hosts", <HostsIcon />],
  ["containers", "/containers", <ContainersIcon />],
  ["services", "/services", <ServicesIcon />],
  ["volumes", "/volumes", <VolumesIcon />],
  ["cron jobs", "/cron_jobs", <CronJobsIcon />],
  ["logs", "/logs", <FileDocument />],
];
export default navItems;
