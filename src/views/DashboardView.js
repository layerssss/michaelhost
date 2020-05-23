import React from "react";
import gql from "graphql-tag";
import { DesktopClassic } from "mdi-material-ui";

import useData from "../hooks/useData";
import {
  HostsIcon,
  CronJobsIcon,
  TerminalsIcon,
  ApplicationsIcon,
} from "../controls/icons";
import StaticForm from "../controls/StaticForm";
import Widget from "../controls/Widget";
import Overview from "../controls/Overview";

export default React.memo(DashboardView);
function DashboardView() {
  const [data] = useData(gql`
    query DashboardView {
      hostname
      version
      hosts {
        id
        hostname
      }
      terminals {
        id
        name
      }
      composeApplications {
        id
      }
      cronJobs {
        id
        command
        cron
      }
    }
  `);
  return (
    <>
      <Widget icon={<DesktopClassic />} title="system info">
        <StaticForm
          fields={[
            ["hostname", data?.hostname],
            ["michaelhost version", data?.version],
          ]}
        />
      </Widget>
      <Widget icon={<HostsIcon />} title="hosts">
        <Overview
          items={data?.hosts.map((host) => [
            host.hostname,
            `/hosts/${host.id}`,
          ])}
          href="/hosts"
        />
      </Widget>
      <Widget icon={<TerminalsIcon />} title="terminals">
        <Overview
          items={data?.terminals.map((terminal) => [
            terminal.name,
            `/terminals/${terminal.id}`,
          ])}
          href="/terminals"
        />
      </Widget>
      <Widget icon={<ApplicationsIcon />} title="applications">
        <Overview
          items={data?.composeApplications.map(({ id }) => [
            id,
            `/applications/${id}`,
          ])}
          href="/applications"
        />
      </Widget>
      <Widget icon={<CronJobsIcon />} title="cron jobs">
        <Overview
          items={data?.cronJobs.map(({ id, command, cron }) => [
            `${command} (${cron})`,
            `/cron_jobs/${id}`,
          ])}
          href="/cron_jobs"
        />
      </Widget>
    </>
  );
}
