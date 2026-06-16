import Project from '../models/Project.model.js';
import Employee from '../models/Employee.model.js';

/**
 * Resolve the set of user ids that fall under a manager's supervision. This is
 * the union of two sources, so a manager sees everyone they're responsible for:
 *
 *  1. Explicit org chart — employees whose `reportsTo` is this manager (the
 *     direct reports an admin assigned in the staff form).
 *  2. Project staffing — the creator and team members of any project the
 *     manager owns or sits on.
 *
 * Plus the manager themselves. Used by attendance, exports, and task lists so
 * they all agree on what "a manager's team" means.
 *
 * @param {{ _id: import('mongoose').Types.ObjectId }} user
 * @returns {Promise<string[]>} distinct user-id strings
 */
export async function getManagedTeamUserIds(user) {
  const [projects, directReports] = await Promise.all([
    Project.find({ $or: [{ createdBy: user._id }, { 'team.user': user._id }] })
      .select('createdBy team.user')
      .lean(),
    Employee.find({ reportsTo: user._id }).select('user').lean(),
  ]);

  const ids = new Set([user._id.toString()]);
  projects.forEach((p) => {
    if (p.createdBy) ids.add(p.createdBy.toString());
    (p.team || []).forEach((t) => t.user && ids.add(t.user.toString()));
  });
  directReports.forEach((e) => e.user && ids.add(e.user.toString()));
  return [...ids];
}
