import React from "react";
import gql from "graphql-tag";

import useData from "../hooks/useData";
import {
  HostsIcon,
  CronJobsIcon,
  TerminalsIcon,
  ApplicationsIcon,
} from "../controls/icons";
import Widget from "../controls/Widget";
import Overview from "../controls/Overview";

export default React.memo(DashboardView);
function DashboardView() {
  const [data] = useData(gql`
    query DashboardView {
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
      <Widget icon={<HostsIcon />} title="hosts">
        <Overview
          items={data?.hosts.map(host => [host.hostname, `/hosts/${host.id}`])}
          href="/hosts"
        />
      </Widget>
      <Widget icon={<TerminalsIcon />} title="terminals">
        <Overview
          items={data?.terminals.map(terminal => [
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
