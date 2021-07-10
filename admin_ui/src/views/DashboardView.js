import React from "react";
import gql from "graphql-tag";
import { DesktopClassic } from "mdi-material-ui";

import useData from "../hooks/useData";
import {
  HostsIcon,
  CronJobsIcon,
  TerminalsIcon,
  ContainersIcon,
  ServicesIcon,
  VolumesIcon,
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
      cronJobs {
        id
        command
        cron
      }
      containers {
        id
        name
        status
      }
      services {
        id
        name
        replicas
      }
      volumes {
        id
        name
        driver
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
      <Widget icon={<CronJobsIcon />} title="cron jobs">
        <Overview
          items={data?.cronJobs.map(({ id, command, cron }) => [
            `${command} (${cron})`,
            `/cron_jobs/${id}`,
          ])}
          href="/cron_jobs"
        />
      </Widget>
      <Widget icon={<ContainersIcon />} title="containers">
        <Overview
          items={data?.containers.map(({ id, name, status }) => [
            `${name} (${status})`,
            `/containers/${id}`,
          ])}
          href="/containers"
        />
      </Widget>
      <Widget icon={<ServicesIcon />} title="services">
        <Overview
          items={data?.services.map(({ id, name, replicas }) => [
            `${name} (${replicas !== null ? replicas : "-"})`,
            `/services/${id}`,
          ])}
          href="/services"
        />
      </Widget>
      <Widget icon={<VolumesIcon />} title="volumes">
        <Overview
          items={data?.volumes.map(({ id, name, driver }) => [
            `${name} (${driver})`,
            `/volumes/${id}`,
          ])}
          href="/volumes"
        />
      </Widget>
    </>
  );
}
