import compile from "@openfn/compiler";
import vm from "node:vm";

const importJob = async (pathToJob, adaptor = "common") => {
  const options = {
    "add-imports": {
      adaptors: [
        {
          name: `@openfn/language-${adaptor}`,
          exportAll: true,
        },
      ],
    },
  };
  const { code } = compile(pathToJob, options);

  const mod = new vm.SourceTextModule(code);

  await mod.link(async (specifier) => {
    const module = await import(specifier);
    const exportNames = Object.keys(module);

    return new vm.SyntheticModule(exportNames, function () {
      exportNames.forEach((key) => {
        this.setExport(key, module[key]);
      });
    });
  });

  await mod.evaluate();

  return mod.namespace;
};

export default importJob;
