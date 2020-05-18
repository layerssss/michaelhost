import React from "react";
import { Gauge, FileDocument } from "mdi-material-ui";

import {
  TerminalsIcon,
  HostsIcon,
  ApplicationsIcon,
  CronJobsIcon,
} from "../controls/icons";

const navItems = [
  ["dashboard", "/dashboard", <Gauge />],
  ["hosts", "/hosts", <HostsIcon />],
  ["terminals", "/terminals", <TerminalsIcon />],
  ["applications", "/applications", <ApplicationsIcon />],
  ["cron jobs", "/cron_jobs", <CronJobsIcon />],
  ["logs", "/logs", <FileDocument />],
];
export default navItems;
