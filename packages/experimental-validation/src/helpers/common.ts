import { AnySchema, makeType } from "../core";
import { errorMessage, ErrorMessage } from "../errors";
import { undefinedType } from "./undefined";
import { union } from "./union";

const required = (typeError?: ErrorMessage) =>
  makeType(
    (val): val is unknown => val !== undefined,
    errorMessage(
      typeError,
      commonMetaKeys.requiredError,
      (label) => `${label} is required`,
      "Expected a string"
    ),
    { ...commonMethods }
  );

export const commonMethods = {
  /**
   * Sets the label of the schema.
   * All default validation error messages will use this label.
   *
   * @param label - The label to use
   * @returns A new schema with this label.
   */
  label<Self extends AnySchema>(this: Self, label: string) {
    return this.withMeta({ label });
  },

  /**
   * Allows you to set a specific error message for cases when a value is undefined.
   * Most schemas will already error if the value is undefined,
   * but it will do so with a generic type error.
   * Useful for forms.
   *
   * @param error - The error message to use. Will be a generic required error by default.
   * @returns A new schema with a required check / error.
   */
  required<Self extends AnySchema>(this: Self, error?: ErrorMessage) {
    return required(error).as(this);
  },

  /**
   * Makes the schema optional by turning it into a union type.
   *
   * @returns A new schema that's a union between this schema and undefined.
   */
  optional<Self extends AnySchema>(this: Self) {
    return union([undefinedType(), this]);
  },
};

export const commonMetaKeys = {
  requiredError: Symbol("required_error"),
};
