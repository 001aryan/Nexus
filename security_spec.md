# Security Specification: Nexus Project Management

## Data Invariants
1. A **User** must have a unique UID matching their Auth ID.
2. A **Project** must have an owner who is also a member.
3. A **Task** must belong to an existing Project.
4. Only Project **Members** can view the project and its tasks.
5. Only Project **Admins** (Owner or designated) can edit project settings or add/remove members.
6. A **Task** status can only move between valid states.
7. **Admins** can perform any operation on entities within their scope.

## The Dirty Dozen Payloads (Rejection Tests)

1. **Identity Spoofing**: Creating a user profile with a different UID than current auth.
2. **Role Escalation**: A regular member trying to update their own `role` to 'admin'.
3. **Ghost Project**: Creating a task for a projectId that doesn't exist.
4. **Unauthorized Read**: User A trying to read Project B where they are not a member.
5. **Unauthorized Task Write**: User A trying to create a task in Project B where they are not a member.
6. **Immutable Field Attack**: Trying to change the `ownerId` of an existing project.
7. **Poisoned ID**: Creating a project with a 2KB long ID string.
8. **Shadow Field**: Adding `isVerified: true` to a user profile payload.
9. **Timestamp Fraud**: Providing a `createdAt` value from the future/past instead of server timestamp.
10. **State Shortcut**: Moving a task from 'todo' to a 'secret_done' state not in enum.
11. **PII Leak**: Unauthenticated user trying to list all user emails.
12. **Resource Exhaustion**: Sending an array of 10,000 members in a single project update.

## Implementation Pattern
- Master Gate: Membership check in parents for all sub-resource access.
- isValidId() guard on all document IDs.
- strict schema mapping in isValid[Entity] helpers.
