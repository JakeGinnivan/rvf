import { DataFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { withYup } from "@rvf/yup";
import { ValidatedForm } from "@rvf/remix";
import * as yup from "yup";
import { SubmitButton } from "~/components/SubmitButton";

const schema = yup.object({});
const validator = withYup(schema);

export const loader = async ({ request }: DataFunctionArgs) => {
  const url = new URL(request.url);
  const isSubmitted = url.searchParams.has("submit");

  if (isSubmitted) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return json({ message: "Submitted!" });
  }

  return json({ message: undefined });
};

export default function FrontendValidation() {
  const data = useLoaderData<typeof loader>();
  return (
    <ValidatedForm validator={validator} method="get">
      {"message" in data && <p>{data.message}</p>}
      <SubmitButton
        name="submit"
        value="true"
        label="Submit"
        submittingLabel="Submitting..."
      />
    </ValidatedForm>
  );
}
