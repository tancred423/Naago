import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as log from "@std/log";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_PATH = join(__dirname, "..");

export class MateriaIconService {
  public static getIconPath(materia: string): string {
    switch (materia) {
      case "Savage Aim Materia I":
        return join(BASE_PATH, "image", "materia", "crt_1.png");
      case "Savage Aim Materia II":
        return join(BASE_PATH, "image", "materia", "crt_2.png");
      case "Savage Aim Materia III":
        return join(BASE_PATH, "image", "materia", "crt_3.png");
      case "Savage Aim Materia IV":
        return join(BASE_PATH, "image", "materia", "crt_4.png");
      case "Savage Aim Materia V":
        return join(BASE_PATH, "image", "materia", "crt_5.png");
      case "Savage Aim Materia VI":
        return join(BASE_PATH, "image", "materia", "crt_6.png");
      case "Savage Aim Materia VII":
        return join(BASE_PATH, "image", "materia", "crt_7.png");
      case "Savage Aim Materia VIII":
        return join(BASE_PATH, "image", "materia", "crt_8.png");
      case "Savage Aim Materia IX":
        return join(BASE_PATH, "image", "materia", "crt_9.png");
      case "Savage Aim Materia X":
        return join(BASE_PATH, "image", "materia", "crt_10.png");
      case "Savage Aim Materia XI":
        return join(BASE_PATH, "image", "materia", "crt_11.png");
      case "Savage Aim Materia XII":
        return join(BASE_PATH, "image", "materia", "crt_12.png");

      case "Heavens' Eye Materia I":
        return join(BASE_PATH, "image", "materia", "dh_1.png");
      case "Heavens' Eye Materia II":
        return join(BASE_PATH, "image", "materia", "dh_2.png");
      case "Heavens' Eye Materia III":
        return join(BASE_PATH, "image", "materia", "dh_3.png");
      case "Heavens' Eye Materia IV":
        return join(BASE_PATH, "image", "materia", "dh_4.png");
      case "Heavens' Eye Materia V":
        return join(BASE_PATH, "image", "materia", "dh_5.png");
      case "Heavens' Eye Materia VI":
        return join(BASE_PATH, "image", "materia", "dh_6.png");
      case "Heavens' Eye Materia VII":
        return join(BASE_PATH, "image", "materia", "dh_7.png");
      case "Heavens' Eye Materia VIII":
        return join(BASE_PATH, "image", "materia", "dh_8.png");
      case "Heavens' Eye Materia IX":
        return join(BASE_PATH, "image", "materia", "dh_9.png");
      case "Heavens' Eye Materia X":
        return join(BASE_PATH, "image", "materia", "dh_10.png");
      case "Heavens' Eye Materia XI":
        return join(BASE_PATH, "image", "materia", "dh_11.png");
      case "Heavens' Eye Materia XII":
        return join(BASE_PATH, "image", "materia", "dh_12.png");

      case "Savage Might Materia I":
        return join(BASE_PATH, "image", "materia", "det_1.png");
      case "Savage Might Materia II":
        return join(BASE_PATH, "image", "materia", "det_2.png");
      case "Savage Might Materia III":
        return join(BASE_PATH, "image", "materia", "det_3.png");
      case "Savage Might Materia IV":
        return join(BASE_PATH, "image", "materia", "det_4.png");
      case "Savage Might Materia V":
        return join(BASE_PATH, "image", "materia", "det_5.png");
      case "Savage Might Materia VI":
        return join(BASE_PATH, "image", "materia", "det_6.png");
      case "Savage Might Materia VII":
        return join(BASE_PATH, "image", "materia", "det_7.png");
      case "Savage Might Materia VIII":
        return join(BASE_PATH, "image", "materia", "det_8.png");
      case "Savage Might Materia IX":
        return join(BASE_PATH, "image", "materia", "det_9.png");
      case "Savage Might Materia X":
        return join(BASE_PATH, "image", "materia", "det_10.png");
      case "Savage Might Materia XI":
        return join(BASE_PATH, "image", "materia", "det_11.png");
      case "Savage Might Materia XII":
        return join(BASE_PATH, "image", "materia", "det_12.png");

      case "Quickarm Materia I":
        return join(BASE_PATH, "image", "materia", "sks_1.png");
      case "Quickarm Materia II":
        return join(BASE_PATH, "image", "materia", "sks_2.png");
      case "Quickarm Materia III":
        return join(BASE_PATH, "image", "materia", "sks_3.png");
      case "Quickarm Materia IV":
        return join(BASE_PATH, "image", "materia", "sks_4.png");
      case "Quickarm Materia V":
        return join(BASE_PATH, "image", "materia", "sks_5.png");
      case "Quickarm Materia VI":
        return join(BASE_PATH, "image", "materia", "sks_6.png");
      case "Quickarm Materia VII":
        return join(BASE_PATH, "image", "materia", "sks_7.png");
      case "Quickarm Materia VIII":
        return join(BASE_PATH, "image", "materia", "sks_8.png");
      case "Quickarm Materia IX":
        return join(BASE_PATH, "image", "materia", "sks_9.png");
      case "Quickarm Materia X":
        return join(BASE_PATH, "image", "materia", "sks_10.png");
      case "Quickarm Materia XI":
        return join(BASE_PATH, "image", "materia", "sks_11.png");
      case "Quickarm Materia XII":
        return join(BASE_PATH, "image", "materia", "sks_12.png");

      case "Quicktongue Materia I":
        return join(BASE_PATH, "image", "materia", "sps_1.png");
      case "Quicktongue Materia II":
        return join(BASE_PATH, "image", "materia", "sps_2.png");
      case "Quicktongue Materia III":
        return join(BASE_PATH, "image", "materia", "sps_3.png");
      case "Quicktongue Materia IV":
        return join(BASE_PATH, "image", "materia", "sps_4.png");
      case "Quicktongue Materia V":
        return join(BASE_PATH, "image", "materia", "sps_5.png");
      case "Quicktongue Materia VI":
        return join(BASE_PATH, "image", "materia", "sps_6.png");
      case "Quicktongue Materia VII":
        return join(BASE_PATH, "image", "materia", "sps_7.png");
      case "Quicktongue Materia VIII":
        return join(BASE_PATH, "image", "materia", "sps_8.png");
      case "Quicktongue Materia IX":
        return join(BASE_PATH, "image", "materia", "sps_9.png");
      case "Quicktongue Materia X":
        return join(BASE_PATH, "image", "materia", "sps_10.png");
      case "Quicktongue Materia XI":
        return join(BASE_PATH, "image", "materia", "sps_11.png");
      case "Quicktongue Materia XII":
        return join(BASE_PATH, "image", "materia", "sps_12.png");

      case "Battledance Materia I":
        return join(BASE_PATH, "image", "materia", "tenacity_1.png");
      case "Battledance Materia II":
        return join(BASE_PATH, "image", "materia", "tenacity_2.png");
      case "Battledance Materia III":
        return join(BASE_PATH, "image", "materia", "tenacity_3.png");
      case "Battledance Materia IV":
        return join(BASE_PATH, "image", "materia", "tenacity_4.png");
      case "Battledance Materia V":
        return join(BASE_PATH, "image", "materia", "tenacity_5.png");
      case "Battledance Materia VI":
        return join(BASE_PATH, "image", "materia", "tenacity_6.png");
      case "Battledance Materia VII":
        return join(BASE_PATH, "image", "materia", "tenacity_7.png");
      case "Battledance Materia VIII":
        return join(BASE_PATH, "image", "materia", "tenacity_8.png");
      case "Battledance Materia IX":
        return join(BASE_PATH, "image", "materia", "tenacity_9.png");
      case "Battledance Materia X":
        return join(BASE_PATH, "image", "materia", "tenacity_10.png");
      case "Battledance Materia XI":
        return join(BASE_PATH, "image", "materia", "tenacity_11.png");
      case "Battledance Materia XII":
        return join(BASE_PATH, "image", "materia", "tenacity_12.png");

      case "Piety Materia I":
        return join(BASE_PATH, "image", "materia", "piety_1.png");
      case "Piety Materia II":
        return join(BASE_PATH, "image", "materia", "piety_2.png");
      case "Piety Materia III":
        return join(BASE_PATH, "image", "materia", "piety_3.png");
      case "Piety Materia IV":
        return join(BASE_PATH, "image", "materia", "piety_4.png");
      case "Piety Materia V":
        return join(BASE_PATH, "image", "materia", "piety_5.png");
      case "Piety Materia VI":
        return join(BASE_PATH, "image", "materia", "piety_6.png");
      case "Piety Materia VII":
        return join(BASE_PATH, "image", "materia", "piety_7.png");
      case "Piety Materia VIII":
        return join(BASE_PATH, "image", "materia", "piety_8.png");
      case "Piety Materia IX":
        return join(BASE_PATH, "image", "materia", "piety_9.png");
      case "Piety Materia X":
        return join(BASE_PATH, "image", "materia", "piety_10.png");
      case "Piety Materia XI":
        return join(BASE_PATH, "image", "materia", "piety_11.png");
      case "Piety Materia XII":
        return join(BASE_PATH, "image", "materia", "piety_12.png");

      case "Craftsman's Command Materia I":
        return join(BASE_PATH, "image", "materia", "control_1.png");
      case "Craftsman's Command Materia II":
        return join(BASE_PATH, "image", "materia", "control_2.png");
      case "Craftsman's Command Materia III":
        return join(BASE_PATH, "image", "materia", "control_3.png");
      case "Craftsman's Command Materia IV":
        return join(BASE_PATH, "image", "materia", "control_4.png");
      case "Craftsman's Command Materia V":
        return join(BASE_PATH, "image", "materia", "control_5.png");
      case "Craftsman's Command Materia VI":
        return join(BASE_PATH, "image", "materia", "control_6.png");
      case "Craftsman's Command Materia VII":
        return join(BASE_PATH, "image", "materia", "control_7.png");
      case "Craftsman's Command Materia VIII":
        return join(BASE_PATH, "image", "materia", "control_8.png");
      case "Craftsman's Command Materia IX":
        return join(BASE_PATH, "image", "materia", "control_9.png");
      case "Craftsman's Command Materia X":
        return join(BASE_PATH, "image", "materia", "control_10.png");
      case "Craftsman's Command Materia XI":
        return join(BASE_PATH, "image", "materia", "control_11.png");
      case "Craftsman's Command Materia XII":
        return join(BASE_PATH, "image", "materia", "control_12.png");

      case "Craftsman's Cunning Materia I":
        return join(BASE_PATH, "image", "materia", "cp_1.png");
      case "Craftsman's Cunning Materia II":
        return join(BASE_PATH, "image", "materia", "cp_2.png");
      case "Craftsman's Cunning Materia III":
        return join(BASE_PATH, "image", "materia", "cp_3.png");
      case "Craftsman's Cunning Materia IV":
        return join(BASE_PATH, "image", "materia", "cp_4.png");
      case "Craftsman's Cunning Materia V":
        return join(BASE_PATH, "image", "materia", "cp_5.png");
      case "Craftsman's Cunning Materia VI":
        return join(BASE_PATH, "image", "materia", "cp_6.png");
      case "Craftsman's Cunning Materia VII":
        return join(BASE_PATH, "image", "materia", "cp_7.png");
      case "Craftsman's Cunning Materia VIII":
        return join(BASE_PATH, "image", "materia", "cp_8.png");
      case "Craftsman's Cunning Materia IX":
        return join(BASE_PATH, "image", "materia", "cp_9.png");
      case "Craftsman's Cunning Materia X":
        return join(BASE_PATH, "image", "materia", "cp_10.png");
      case "Craftsman's Cunning Materia XI":
        return join(BASE_PATH, "image", "materia", "cp_11.png");
      case "Craftsman's Cunning Materia XII":
        return join(BASE_PATH, "image", "materia", "cp_12.png");

      case "Craftsman's Competence Materia I":
        return join(BASE_PATH, "image", "materia", "cms_1.png");
      case "Craftsman's Competence Materia II":
        return join(BASE_PATH, "image", "materia", "cms_2.png");
      case "Craftsman's Competence Materia III":
        return join(BASE_PATH, "image", "materia", "cms_3.png");
      case "Craftsman's Competence Materia IV":
        return join(BASE_PATH, "image", "materia", "cms_4.png");
      case "Craftsman's Competence Materia V":
        return join(BASE_PATH, "image", "materia", "cms_5.png");
      case "Craftsman's Competence Materia VI":
        return join(BASE_PATH, "image", "materia", "cms_6.png");
      case "Craftsman's Competence Materia VII":
        return join(BASE_PATH, "image", "materia", "cms_7.png");
      case "Craftsman's Competence Materia VIII":
        return join(BASE_PATH, "image", "materia", "cms_8.png");
      case "Craftsman's Competence Materia IX":
        return join(BASE_PATH, "image", "materia", "cms_9.png");
      case "Craftsman's Competence Materia X":
        return join(BASE_PATH, "image", "materia", "cms_10.png");
      case "Craftsman's Competence Materia XI":
        return join(BASE_PATH, "image", "materia", "cms_11.png");
      case "Craftsman's Competence Materia XII":
        return join(BASE_PATH, "image", "materia", "cms_12.png");

      case "Gatherer's Grasp Materia I":
        return join(BASE_PATH, "image", "materia", "gp_1.png");
      case "Gatherer's Grasp Materia II":
        return join(BASE_PATH, "image", "materia", "gp_2.png");
      case "Gatherer's Grasp Materia III":
        return join(BASE_PATH, "image", "materia", "gp_3.png");
      case "Gatherer's Grasp Materia IV":
        return join(BASE_PATH, "image", "materia", "gp_4.png");
      case "Gatherer's Grasp Materia V":
        return join(BASE_PATH, "image", "materia", "gp_5.png");
      case "Gatherer's Grasp Materia VI":
        return join(BASE_PATH, "image", "materia", "gp_6.png");
      case "Gatherer's Grasp Materia VII":
        return join(BASE_PATH, "image", "materia", "gp_7.png");
      case "Gatherer's Grasp Materia VIII":
        return join(BASE_PATH, "image", "materia", "gp_8.png");
      case "Gatherer's Grasp Materia IX":
        return join(BASE_PATH, "image", "materia", "gp_9.png");
      case "Gatherer's Grasp Materia X":
        return join(BASE_PATH, "image", "materia", "gp_10.png");
      case "Gatherer's Grasp Materia XI":
        return join(BASE_PATH, "image", "materia", "gp_11.png");
      case "Gatherer's Grasp Materia XII":
        return join(BASE_PATH, "image", "materia", "gp_12.png");

      case "Gatherer's Guerdon Materia I":
        return join(BASE_PATH, "image", "materia", "gathering_1.png");
      case "Gatherer's Guerdon Materia II":
        return join(BASE_PATH, "image", "materia", "gathering_2.png");
      case "Gatherer's Guerdon Materia III":
        return join(BASE_PATH, "image", "materia", "gathering_3.png");
      case "Gatherer's Guerdon Materia IV":
        return join(BASE_PATH, "image", "materia", "gathering_4.png");
      case "Gatherer's Guerdon Materia V":
        return join(BASE_PATH, "image", "materia", "gathering_5.png");
      case "Gatherer's Guerdon Materia VI":
        return join(BASE_PATH, "image", "materia", "gathering_6.png");
      case "Gatherer's Guerdon Materia VII":
        return join(BASE_PATH, "image", "materia", "gathering_7.png");
      case "Gatherer's Guerdon Materia VIII":
        return join(BASE_PATH, "image", "materia", "gathering_8.png");
      case "Gatherer's Guerdon Materia IX":
        return join(BASE_PATH, "image", "materia", "gathering_9.png");
      case "Gatherer's Guerdon Materia X":
        return join(BASE_PATH, "image", "materia", "gathering_10.png");
      case "Gatherer's Guerdon Materia XI":
        return join(BASE_PATH, "image", "materia", "gathering_11.png");
      case "Gatherer's Guerdon Materia XII":
        return join(BASE_PATH, "image", "materia", "gathering_12.png");

      case "Gatherer's Guile Materia I":
        return join(BASE_PATH, "image", "materia", "perception_1.png");
      case "Gatherer's Guile Materia II":
        return join(BASE_PATH, "image", "materia", "perception_2.png");
      case "Gatherer's Guile Materia III":
        return join(BASE_PATH, "image", "materia", "perception_3.png");
      case "Gatherer's Guile Materia IV":
        return join(BASE_PATH, "image", "materia", "perception_4.png");
      case "Gatherer's Guile Materia V":
        return join(BASE_PATH, "image", "materia", "perception_5.png");
      case "Gatherer's Guile Materia VI":
        return join(BASE_PATH, "image", "materia", "perception_6.png");
      case "Gatherer's Guile Materia VII":
        return join(BASE_PATH, "image", "materia", "perception_7.png");
      case "Gatherer's Guile Materia VIII":
        return join(BASE_PATH, "image", "materia", "perception_8.png");
      case "Gatherer's Guile Materia IX":
        return join(BASE_PATH, "image", "materia", "perception_9.png");
      case "Gatherer's Guile Materia X":
        return join(BASE_PATH, "image", "materia", "perception_10.png");
      case "Gatherer's Guile Materia XI":
        return join(BASE_PATH, "image", "materia", "perception_11.png");
      case "Gatherer's Guile Materia XII":
        return join(BASE_PATH, "image", "materia", "perception_12.png");

      default:
        log.error(`[ERROR] Materia '${materia}' doesn't exist.'`);
        return join(BASE_PATH, "image", "materia", "fallback.png");
    }
  }
}
