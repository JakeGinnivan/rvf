import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { useForm } from "../useForm";
import { successValidator } from "./util/successValidator";
import { useEffect, useRef } from "react";
import { createValidator } from "@rvf/core";
import { useFormScope } from "../useFormScope";
import userEvent from "@testing-library/user-event";

const withResolvers = () => {
  let resolve;
  let reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise,
    resolve: resolve as never as () => void,
    reject: reject as never as () => void,
  };
};

it("should return submit state", async () => {
  let prom: PromiseWithResolvers<any> | null = null;
  const submission = () => {
    prom = withResolvers();
    return prom.promise;
  };

  const { result } = renderHook(() => {
    const form = useForm({
      submitSource: "state",
      defaultValues: {
        foo: "bar",
      },
      validator: successValidator,
      handleSubmit: submission,
    });
    return {
      state: {
        isSubmitting: form.formState.isSubmitting,
        submitStatus: form.formState.submitStatus,
        hasBeenSubmitted: form.formState.hasBeenSubmitted,
      },
      submit: form.submit,
    };
  });

  expect(result.current.state).toEqual({
    isSubmitting: false,
    submitStatus: "idle",
    hasBeenSubmitted: false,
  });

  act(() => result.current.submit());
  await waitFor(() => {
    expect(result.current.state).toEqual({
      isSubmitting: true,
      submitStatus: "submitting",
      hasBeenSubmitted: true,
    });
  });

  act(() => prom?.resolve({}));
  await waitFor(() => {
    expect(result.current.state).toEqual({
      isSubmitting: false,
      submitStatus: "success",
      hasBeenSubmitted: true,
    });
  });

  act(() => result.current.submit());
  await waitFor(() => {
    expect(result.current.state).toEqual({
      isSubmitting: true,
      submitStatus: "submitting",
      hasBeenSubmitted: true,
    });
  });

  act(() => prom?.reject({}));
  await waitFor(() => {
    expect(result.current.state).toEqual({
      isSubmitting: false,
      submitStatus: "error",
      hasBeenSubmitted: true,
    });
  });
});

it("should return form dirty/touched/valid state", async () => {
  let prom: PromiseWithResolvers<any> | null = null;
  const validator = createValidator({
    validate: () => {
      prom = withResolvers();
      return prom.promise;
    },
  });

  const { result } = renderHook(() => {
    const form = useForm({
      submitSource: "state",
      defaultValues: {
        foo: "bar",
      },
      validator,
      handleSubmit: vi.fn(),
    });
    return {
      state: {
        dirty: form.formState.isDirty,
        touched: form.formState.isTouched,
        valid: form.formState.isValid,
      },
      foo: form.field("foo"),
      submit: form.submit,
    };
  });

  expect(result.current.state).toEqual({
    dirty: false,
    touched: false,
    valid: true,
  });

  act(() => {
    result.current.submit();
  });
  await waitFor(() => {
    expect(prom).not.toBeNull();
  });
  act(() => {
    prom?.resolve({ error: { foo: "bar" } });
  });

  await waitFor(() => {
    expect(result.current.state).toEqual({
      dirty: false,
      touched: false,
      valid: false,
    });
  });

  act(() => {
    result.current.foo.onChange("test");
    prom?.resolve({ data: { foo: "test" } });
  });
  await waitFor(() => {
    expect(result.current.state).toEqual({
      dirty: true,
      touched: false,
      valid: true,
    });
  });

  act(() => {
    result.current.foo.onBlur();
    prom?.resolve({ data: { foo: "test" } });
  });
  await waitFor(() => {
    expect(result.current.state).toEqual({
      dirty: true,
      touched: true,
      valid: true,
    });
  });
});

it("should be possible to access the default values in the form or a field", async () => {
  const { result } = renderHook(() => {
    const form = useForm({
      submitSource: "state",
      defaultValues: {
        foo: "bar",
      },
      validator: successValidator,
      handleSubmit: vi.fn(),
    });
    return {
      defaultValues: {
        form: form.defaultValue(),
        foo: form.defaultValue("foo"),
      },
      foo: form.field("foo"),
      reset: form.resetForm,
    };
  });

  expect(result.current.defaultValues).toEqual({
    form: { foo: "bar" },
    foo: "bar",
  });

  act(() => result.current.foo.onChange("test"));
  await waitFor(() => {
    expect(result.current.defaultValues).toEqual({
      form: { foo: "bar" },
      foo: "bar",
    });
  });

  act(() => result.current.reset({ foo: "bob ross" }));
  await waitFor(() => {
    expect(result.current.defaultValues).toEqual({
      form: { foo: "bob ross" },
      foo: "bob ross",
    });
  });

  act(() => result.current.foo.onChange("test"));
  await waitFor(() => {
    expect(result.current.defaultValues).toEqual({
      form: { foo: "bob ross" },
      foo: "bob ross",
    });
  });
});

it("should be possible to set the dirty state of a field", async () => {
  let prom: PromiseWithResolvers<any> | null = null;
  const validator = createValidator({
    validate: () => {
      prom = withResolvers();
      return prom.promise;
    },
  });

  const { result } = renderHook(() => {
    const form = useForm({
      submitSource: "state",
      defaultValues: {
        foo: "bar",
      },
      validator,
      handleSubmit: vi.fn(),
    });
    return {
      state: {
        dirty: form.formState.isDirty,
        touched: form.formState.isTouched,
        valid: form.formState.isValid,
        error: form.error("foo"),
      },
      setDirty: form.setDirty,
      setTouched: form.setTouched,
      clearError: form.clearError,
      _setError: form.scope().__store__.store.getState().setError,
    };
  });

  expect(result.current.state).toEqual({
    dirty: false,
    touched: false,
    valid: true,
    error: null,
  });

  act(() => {
    result.current.setDirty("foo", true);
  });
  await waitFor(() => {
    expect(result.current.state).toEqual({
      dirty: true,
      touched: false,
      valid: true,
      error: null,
    });
  });

  act(() => {
    result.current.setTouched("foo", true);
  });
  await waitFor(() => {
    expect(result.current.state).toEqual({
      dirty: true,
      touched: true,
      valid: true,
      error: null,
    });
  });

  act(() => {
    result.current._setError("foo", "test");
  });
  await waitFor(() => {
    expect(result.current.state).toEqual({
      dirty: true,
      touched: true,
      valid: false,
      error: "test",
    });
  });

  act(() => {
    result.current.clearError("foo");
  });
  await waitFor(() => {
    expect(result.current.state).toEqual({
      dirty: true,
      touched: true,
      valid: true,
      error: null,
    });
  });
});

it("should be possible to set the dirty/touched/error state of the entire form scope", async () => {
  const { result } = renderHook(() => {
    const form = useForm({
      submitSource: "state",
      defaultValues: {
        foo: "bar",
      },
      validator: successValidator,
      handleSubmit: vi.fn(),
    });

    return {
      state: {
        dirty: form.dirty(),
        touched: form.touched(),
        error: form.error(),
      },
      setDirty: form.setDirty,
      setTouched: form.setTouched,
    };
  });

  expect(result.current.state).toEqual({
    dirty: false,
    touched: false,
    error: null,
  });

  act(() => {
    result.current.setDirty(true);
  });

  expect(result.current.state).toEqual({
    dirty: true,
    touched: false,
    error: null,
  });

  act(() => {
    result.current.setTouched(true);
  });
  await waitFor(() => {
    expect(result.current.state).toEqual({
      dirty: true,
      touched: true,
      error: null,
    });
  });
});

it("should always give most up-to-date state when accessed outside of render", async () => {
  const { result } = renderHook(() => {
    const form = useForm({
      submitSource: "state",
      defaultValues: {
        foo: "bar",
      },
      validator: successValidator,
      handleSubmit: vi.fn(),
    });

    const initialRef = useRef(form.dirty("foo"));
    const changedRef = useRef(form.dirty("foo"));
    useEffect(() => {
      form.setDirty("foo", true);
      changedRef.current = form.dirty("foo");
    }, [form]);

    return {
      touched: form.touched,
      setTouched: form.setTouched,
      dirty: {
        initial: initialRef,
        changed: changedRef,
      },
    };
  });

  const res = result.current;
  expect(res.dirty.initial.current).toBe(false);
  expect(res.dirty.changed.current).toBe(true);
});

it("should be possible to set the value for the entire form scope or a field", async () => {
  const { result } = renderHook(() => {
    const form = useForm({
      submitSource: "state",
      defaultValues: {
        foo: "bar",
      },
      validator: successValidator,
      handleSubmit: vi.fn(),
    });

    const scope = useFormScope(form.scope("foo"));
    return {
      value: form.value(),
      setValue: form.setValue,
      scopedSet: scope.setValue,
    };
  });

  expect(result.current.value).toEqual({
    foo: "bar",
  });

  act(() => {
    result.current.setValue("foo", "bob");
  });
  expect(result.current.value).toEqual({
    foo: "bob",
  });

  act(() => {
    result.current.setValue({
      foo: "baz",
    });
  });
  expect(result.current.value).toEqual({
    foo: "baz",
  });

  act(() => {
    result.current.scopedSet("quux");
  });
  expect(result.current.value).toEqual({
    foo: "quux",
  });
});

it("should be possible to access the latest value of a field in a callback", async () => {
  const show = vi.fn();
  const Component = () => {
    const form = useForm({
      defaultValues: {
        foo: "bar",
      },
      validator: successValidator,
    });

    return (
      <form {...form.getFormProps()} data-testid="form">
        <input data-testid="foo" {...form.getInputProps("foo")} />
        <button
          type="button"
          data-testid="show-value"
          onClick={() => show(form.transient.value("foo"))}
        />
        <button
          type="button"
          data-testid="show-stale-value"
          onClick={() => show(form.value("foo"))}
        />
      </form>
    );
  };

  render(<Component />);

  await userEvent.click(screen.getByTestId("show-value"));
  expect(show).toHaveBeenLastCalledWith("bar");
  await userEvent.click(screen.getByTestId("show-stale-value"));
  expect(show).toHaveBeenLastCalledWith("bar");

  await userEvent.type(screen.getByTestId("foo"), "test");

  await userEvent.click(screen.getByTestId("show-value"));
  expect(show).toHaveBeenLastCalledWith("bartest");
  await userEvent.click(screen.getByTestId("show-stale-value"));
  expect(show).toHaveBeenLastCalledWith("bart"); // not sure why it still updates once
});
