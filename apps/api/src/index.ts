/** Point d'entrée : démarre le serveur HTTP. */
import { createApp } from "./app.js";
import { config } from "./config.js";

createApp().listen(config.PORT, () => {
  console.log(`API prête sur http://localhost:${config.PORT}/api/v1`);
});
