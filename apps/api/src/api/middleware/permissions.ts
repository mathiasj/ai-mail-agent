import type { Context, Next } from 'hono';

type Permission = 'read' | 'write' | 'delete';

export function requirePermission(...permissions: Permission[]) {
  return async (c: Context, next: Next) => {
    const authMethod = c.get('authMethod');

    // JWT users (Velocity) get full access to their own data
    if (authMethod === 'jwt') {
      return next();
    }

    // API key users check permissions
    const apiKey = c.get('apiKey');
    if (!apiKey) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    for (const perm of permissions) {
      if (perm === 'read' && !apiKey.permissions.canRead) {
        return c.json({ error: 'API key lacks read permission' }, 403);
      }
      if (perm === 'write' && !apiKey.permissions.canWrite) {
        return c.json({ error: 'API key lacks write permission' }, 403);
      }
      if (perm === 'delete' && !apiKey.permissions.canDelete) {
        return c.json({ error: 'API key lacks delete permission' }, 403);
      }
    }

    return next();
  };
}
