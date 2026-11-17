import { AuthSettings } from "./operations/auth/AuthSettings.ts";
import { StaticSettings } from "./operations/settings/StaticSettings.ts";
import { SearchSettings } from "./operations/sorzs/SearchSettings.ts";
import { Server } from "./server.ts";

const port = Number(Bun.env.PORT ?? 3000);
const dataDir = Bun.env.DATA_DIR ?? "./data";
const auth = AuthSettings.fromEnv(Bun.env);
const search = SearchSettings.fromEnv(Bun.env);
const files = StaticSettings.fromEnv(Bun.env);

Server.start(port, dataDir, auth, search, files);
