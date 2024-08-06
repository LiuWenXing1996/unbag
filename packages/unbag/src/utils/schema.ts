import { type ZodTypeAny, type ZodUnion, z, ZodArray, ZodString, ZodFunction, ZodTuple, ZodType
// ZodFunction,
} from "zod";
export type ConfigSchemaUnionInput = [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]];
export type ConfigSchemaInput = ZodTypeAny | ConfigSchemaUnionInput;
export type TryUnion<T extends ConfigSchemaInput> = T extends ConfigSchemaUnionInput ? ZodUnion<T> : T;
// type Test = TryUnion<[ZodString, ZodArray<ZodString>]>;

// export const defineConfigSchema = <
//   I extends ConfigSchemaInput,
//   //@ts-ignore
//   O extends ZodTypeAny = TryUnion<I>
// >(
//   input: I,
//   output?: (input: I, tryUnionSchema: TryUnion<I>) => O
// ): [TryUnion<I>, O] => {
//   const inputSchema = (
//     Array.isArray(input) ? z.union(input) : input
//   ) as TryUnion<I>;
//   const outputSchema = (output ? output(input, inputSchema) : inputSchema) as O;
//   return [inputSchema, outputSchema];
// };

export const defineConfigSchema = <T, D extends z.ZodType<any, any, any> = z.ZodSchema<T>, B extends z.ZodType<any, any, any> = z.ZodType<z.output<D>, any, any>>(func: () => B) => {
  return z.lazy(() => {
    const a = func();
    return a;
  });
};
const a = defineConfigSchema(() => z.object({
  s: z.string().default("1").optional()
  // ss: z.string(),
}));
type A = z.infer<typeof a>;