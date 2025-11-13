import { StringManipulationService } from "./StringManipulationService.ts";

export class ArrayManipulationService {
  public static prettifyPermissionArray(permissions: string[]): string {
    const pretty: string[] = [];
    permissions.forEach((permission) => {
      const split = permission.split("_");
      pretty.push(
        `${StringManipulationService.capitalizeFirstLetter(split[0])} ${
          StringManipulationService.capitalizeFirstLetter(
            split[1] || "",
          )
        }`,
      );
    });

    return pretty.join(", ");
  }

  public static removeItemFromArray<T>(array: T[], item: T): void {
    const index = array.indexOf(item);
    if (index > -1) {
      array.splice(index, 1);
    }
  }

  public static removeIndicesFromArray<T>(arr: T[], ...indices: number[]): string {
    return arr.filter((_, index) => !indices.includes(index)).join(" ");
  }
}
