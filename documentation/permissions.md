# Permissions

Skill Pet has no accounts, roles, tokens, database, or remote multi-user resources. The local OS user running the app is the only actor.

| Resource | Operation | Allowed actor | Enforcement |
| --- | --- | --- | --- |
| Local skill directories | Read bounded metadata/content | Current local user | Rust scanner only; no write command exists. |
| App window | Move, resize, expand, collapse | Current local user | Tauri commands compiled into the app. |
| Skills | Execute, edit, install, remove, enable | Nobody | No UI action or Rust command exists. |
| Network / cloud account | Read or write | Nobody | No provider/client is configured. |

There are no row-level security rules because the application has no database.
