import Link from "next/link";
import ActionForm from "@/components/admin/ActionForm";
import { getApplications } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { deleteApplication, setApplicationStatus } from "../actions";

type Props = { searchParams: Promise<{ status?: string }> };

const STATUSES = ["new", "reviewing", "accepted", "declined"] as const;
const PILL = { new: "blue", reviewing: "amber", accepted: "green", declined: "red" } as const;

export default async function AdminApplicationsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const all = await getApplications();
  const applications = status ? all.filter(item => item.status === status) : all;

  return (
    <>
      <div className="adm-page-head">
        <div>
          <span className="adm-crumb">Admin</span>
          <h1>Applications</h1>
          <p>Submissions from the “Become a partner” form.</p>
        </div>

        <nav className="adm-tabs" aria-label="Filter by status">
          <Link href="/admin/applications" className={!status ? "active" : ""}>All ({all.length})</Link>
          {STATUSES.map(value => (
            <Link key={value} href={`/admin/applications?status=${value}`} className={status === value ? "active" : ""}>
              {value[0].toUpperCase() + value.slice(1)} ({all.filter(item => item.status === value).length})
            </Link>
          ))}
        </nav>
      </div>

      {applications.length === 0 ? (
        <section className="adm-panel">
          <p className="adm-empty">No applications here.</p>
        </section>
      ) : (
        <div className="adm-cards">
          {applications.map(application => (
            <article className="adm-card" key={application.id}>
              <div className="adm-card-head">
                <div>
                  <h2>{application.name}</h2>
                  <span className="adm-sub adm-mono">{shortDate(application.createdAt, true)}</span>
                </div>
                <span className={`adm-pill ${PILL[application.status]}`}>{application.status}</span>
              </div>

              <dl className="adm-dl">
                <dt>Email</dt>
                <dd><a href={`mailto:${application.email}`}>{application.email}</a></dd>
                <dt>Profile</dt>
                <dd>{application.socialProfile}</dd>
                <dt>Followers</dt>
                <dd>{application.followers}</dd>
                {application.niche && (
                  <>
                    <dt>Niche</dt>
                    <dd>{application.niche}</dd>
                  </>
                )}
              </dl>

              {application.message && <p className="adm-quote">{application.message}</p>}

              <div className="adm-toolbar">
                <ActionForm action={setApplicationStatus} autoSubmit>
                  <input type="hidden" name="id" value={application.id} />
                  <select
                    className="adm-select adm-select-sm"
                    name="status"
                    defaultValue={application.status}
                    aria-label={`Status for ${application.name}`}
                  >
                    {STATUSES.map(value => <option key={value} value={value}>{value}</option>)}
                  </select>
                </ActionForm>
                <ActionForm action={deleteApplication} confirm={`Delete ${application.name}'s application?`}>
                  <input type="hidden" name="id" value={application.id} />
                  <button className="adm-btn adm-btn-sm adm-btn-danger" type="submit">Delete</button>
                </ActionForm>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
