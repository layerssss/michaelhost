import DashboardView from "../views/DashboardView";
import HostsView from "../views/HostsView";
import NewHostView from "../views/NewHostView";
import HostView from "../views/HostView";
import EditHostView from "../views/EditHostView";
import NewTerminalView from "../views/NewTerminalView";
import TerminalView from "../views/TerminalView";
import TerminalsView from "../views/TerminalsView";
import ApplicationsView from "../views/ApplicationsView";
import NewApplicationsView from "../views/NewApplicationView";
import ApplicationView from "../views/ApplicationView";
import ApplicationLogsView from "../views/ApplicationLogsView";
import ApplicationRunView from "../views/ApplicationRunView";
import ApplicationExecView from "../views/ApplicationExecView";
import ApplicationMapPortView from "../views/ApplicationMapPortView";
import CronJobView from "../views/CronJobView";
import CronJobsView from "../views/CronJobsView";
import NewCronJobView from "../views/NewCronJobView";
import EditCronJobView from "../views/EditCronJobView";
import LogsView from "../views/LogsView";

const routes = [
  ["/dashboard", DashboardView],
  ["/hosts", HostsView],
  ["/hosts/new", NewHostView],
  ["/hosts/:hostId(\\w{8,})", HostView],
  ["/hosts/:hostId(\\w{8,})/edit", EditHostView],
  ["/terminals", TerminalsView],
  ["/terminals/new", NewTerminalView],
  ["/terminals/:terminalId(\\w{8,})", TerminalView],
  ["/applications", ApplicationsView],
  ["/applications/new", NewApplicationsView],
  ["/applications/:applicationId(\\w{8,})", ApplicationView],
  ["/applications/:applicationId(\\w{8,})/logs", ApplicationLogsView],
  ["/applications/:applicationId(\\w{8,})/run", ApplicationRunView],
  ["/applications/:applicationId(\\w{8,})/exec", ApplicationExecView],
  ["/applications/:applicationId(\\w{8,})/map_port", ApplicationMapPortView],
  ["/cron_jobs", CronJobsView],
  ["/cron_jobs/new", NewCronJobView],
  ["/cron_jobs/:cronJobId(\\w{8,})", CronJobView],
  ["/cron_jobs/:cronJobId(\\w{8,})/edit", EditCronJobView],
  ["/logs", LogsView],
];
export default routes;
