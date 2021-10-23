import _ from 'lodash';
import {TAllClassnames} from '../types/classes';
import {TailwindConfigParser} from './TailwindConfigParser';

export class FileContentGenerator {
  private _configParser: TailwindConfigParser;
  private _generatedClassNames: TAllClassnames;

  /**
   * Initializes a new instance of the `FileContentGenerator` class.
   * @param generatedClassnames The generated classnames to put in the template.
   */
  constructor(generatedClassnames: TAllClassnames, configParser: TailwindConfigParser) {
    this._configParser = configParser;
    this._generatedClassNames = generatedClassnames;
  }

  public generateFileContent = (): string => {
    return (
      this.fileHeaderTemplate() +
      '\n\n' +
      this.importStatementsTemplate() +
      '\n\n' +
      this.regularClassnamesTypesTemplate() +
      '\n\n' +
      this.variantsTypeTemplate() +
      '\n\n' +
      this.pseudoClassnamesTypesTemplate() +
      '\n\n' +
      this.utilityFunctionsTemplate() +
      '\n\n' +
      this.mainExportStatementsTemplate()
    );
  };

  private fileHeaderTemplate = (): string => {
    return (
      '/* eslint-disable */\n' +
      '/* tslint:disable */\n' +
      '\n' +
      '//////////////////////////////////////////////////////////////////////////////\n' +
      '/// Autogenerated by tailwindcss-classnames CLI. https://git.io/JtsPU\n' +
      '/// DO NOT EDIT THIS FILE DIRECTLY!\n' +
      '//////////////////////////////////////////////////////////////////////////////\n'
    );
  };

  private importStatementsTemplate = (): string => {
    return "import classnamesLib from 'clsx';" + '\n' + `T_CUSTOM_CLASSES_IMPORT_STATEMENT`;
  };

  private variantsTypeTemplate = (): string => {
    const variants = this._configParser.getVariants();

    return this.generateTypesTemplate(
      'PseudoClassVariants',
      variants.map(variant => variant + this._configParser.getSeparator()), // 'hover:', 'focus:'
      undefined,
      true,
    );
  };

  private regularClassnamesTypesTemplate = (): string => {
    const generatedClassnamesTemplate = Object.keys(this._generatedClassNames)
      .map(classGroupKey => {
        return this.generateTypesGroupTemplate(
          this._generatedClassNames[classGroupKey as keyof TAllClassnames] as TAllClassnames,
          classGroupKey,
        );
      })
      .join('\n');

    // TODO: do not generate this template
    const allclassnamesExportTemplate = this.generateTypesTemplate(
      'Classes',
      Object.keys(this._generatedClassNames).map(x => 'T' + x),
      undefined,
      false,
    );

    return generatedClassnamesTemplate + '\n\n' + allclassnamesExportTemplate;
  };

  private pseudoClassnamesTypesTemplate = (): string => {
    /**
     * Let TypeScript show the types on demand, by using template literal types
     *
     * PROS:
     *   - better performance overall
     *   - low disk usage  (~1.6 mb file)
     *   - fast code generation by CLI, low RAM usage
     *
     * CONS:
     *   - Typography, Borders and Backgrounds types cant be represented [ts(2590)]s
     */

    return Object.keys(this._generatedClassNames)
      .map(categoryKey => {
        return (
          `export type T${_.upperFirst(categoryKey)}PseudoClassnames = ` +
          '`${TPseudoClassVariants}' +
          this._configParser.getSeparator() +
          this._configParser.getPrefix() +
          '${T' +
          _.upperFirst(categoryKey) +
          '}`'
        );
      })
      .join('\n\n');

    /**
     * Generate the classnames and write them to disk
     *
     * PROS:
     *   - no ts(2590) error, but these types does not load or take lots of time to load
     * CONS:
     *   - Huge file size (~90 mb)
     *   - CLI takes a lot of time to generate the file
     *   - CLI takes lots of RAM and often fails due to heap allocation errors
     *   - Typography, Borders and Backgrounds are extremely slow to load, or does not load at all
     *   - overall bad performace interacting with files importing from the file.
     *   -
     */

    // let template = '';
    // for (const [keyOfCategory, value] of Object.entries(this._generatedClassNames)) {
    //   const categoryObject = this._generatedClassNames[keyOfCategory as keyof TAllClassnames];
    //   if (categoryObject !== undefined) {
    //     const allClassnamesInCategory: string[] = Object.keys(value)
    //       .map(k => {
    //         return categoryObject[k as keyof typeof categoryObject];
    //       })
    //       .flat();
    //     const pseudoClassnamesOfCategory = this._configParser.getVariants().flatMap(variant => {
    //       return allClassnamesInCategory.map(classname => {
    //         return (
    //           variant +
    //           this._configParser.getSeparator() +
    //           this._configParser.getPrefix() +
    //           classname
    //         );
    //       });
    //     });
    //     template =
    //       template +
    //       this.generateTypesTemplate(
    //         `${keyOfCategory}PseudoClassnames`,
    //         pseudoClassnamesOfCategory,
    //         undefined,
    //         true,
    //       ) +
    //       '\n\n';
    //   }
    // }
    // return template;
  };

  private utilityFunctionsTemplate = (): string => {
    return Object.keys(this._generatedClassNames)
      .map(categoryGroupName => {
        const categoryType = `T${categoryGroupName}`; // TTypography

        return (
          `type ${categoryType}Key = ${categoryType} | ${categoryType}PseudoClassnames | TTailwindString\n` +
          `type ${categoryType}Arg = ${categoryType} | ${categoryType}PseudoClassnames | null | undefined | {[key in ${categoryType}Key]?: boolean} | TTailwindString\n` +
          `type ${categoryType}UtilityFunction = (...args: ${categoryType}Arg[]) => TTailwindString\n` +
          //prettier-ignore
          `export const ${_.lowerFirst(categoryGroupName)}: ${categoryType}UtilityFunction = classnamesLib as any\n`
        );
      })
      .join('\n');
  };

  private mainExportStatementsTemplate = (): string => {
    return (
      `export const CN = {${Object.keys(this._generatedClassNames)
        .map(cn => _.lowerFirst(cn))
        .join(', ')}}\n` +
      'export type TTailwindString = "TAILWIND_STRING"\n' +
      '\n' +
      'export type TKey = TClasses | TTailwindStringIMPORTED_T_CUSTOM_CLASSES_KEY\n' +
      '\n' +
      'export type TArg =\n' +
      '| TClasses\n' +
      '| null\n' +
      '| undefined\n' +
      '| {[key in TKey]?: boolean}\n' +
      '| TTailwindString\nIMPORTED_T_CUSTOM_CLASSES_ARG' +
      '\n' +
      'export type TTailwind = (...args: TArg[]) => TTailwindString\n' +
      '\n' +
      'export const classnames: TTailwind = classnamesLib as any\n\n' +
      'export const tw = classnames\n\n' +
      'export default tw\n\n'
    );
  };

  /**
   * Generates types group template for a utility classes group object.
   *
   *
   * ### example:
   *
   * A utility group object as:
   *
   * ```js
   * const FlexBox = {
   *   alignSelf: ['self-auto', 'self-start', 'self-center'],
   *   flexWrap: ['flex-nowrap', 'flex-wrap'],
   * }
   *```
   *
   * will produce a template which looks like this:
   *
   * ```ts
   * export type TFlexWrap =
   * | 'flex-nowrap'
   * | 'flex-wrap';
   *
   * export type TAlignSelf =
   * | 'self-auto'
   * | 'self-start'
   * | 'self-center';
   *
   * export type TFlexBox = TFlexWrap | TAlignSelf;
   * ```
   */
  private generateTypesGroupTemplate = (group: TAllClassnames, groupName: string): string => {
    const members = Object.keys(group);

    const generateMembersStatements = (): string[] => {
      return members.map(member => {
        return this.generateTypesTemplate(
          member,
          group[member as keyof TAllClassnames] as string[],
          this._configParser.getPrefix(),
        );
      });
    };

    const generateGroupStatement = (): string => {
      const getMembersStatementsReferences = (): string =>
        members.map(member => 'T' + _.upperFirst(member)).join('\n  | ');

      return (
        `export type T${_.upperFirst(groupName)} =` +
        '\n  | ' +
        getMembersStatementsReferences() +
        '\n'
      );
    };

    return generateMembersStatements().join('\n\n') + '\n\n' + generateGroupStatement();
  };

  /**
   * Generates TS types template from a list of strings.
   *
   * #### Example:
   *
   * Given typeName: 'baz' and items:
   * ```js
   * ['foo', 'bar']
   * ```
   *
   * generates:
   *
   * ```
   * export type TBaz
   *   | foo
   *   | bar;
   * ```
   * or with quoutes:
   * ```
   * export type TBaz
   *   | 'foo'
   *   | 'bar';
   * ```
   * @param typeName The name of the type (without T prefix).
   * @param items The list of the strings of items to add to the type name.
   * @param prefix The prefix to add to the beginning of each item of the string array.
   * @param surroundWithQuotes Whether to quote the types or not (make it a string or an actual type)
   */
  private generateTypesTemplate = (
    typeName: string,
    items: string[],
    prefix?: string,
    surroundWithQuotes: boolean = true,
  ): string => {
    return (
      `export type T${_.upperFirst(typeName)} =` +
      '\n  | ' +
      items
        .flatMap(item => {
          const classnamesThatShouldKeepTheDefaultSuffix = ['cursor'];

          return classnamesThatShouldKeepTheDefaultSuffix.map(x => {
            const shouldKeepDefaultSuffix: boolean = item.includes(x);
            const name = shouldKeepDefaultSuffix ? item : item.replace('-DEFAULT', '');

            const nameWithOrWithoutPrefix = `${prefix ? prefix : ''}${name}`;

            return surroundWithQuotes ? `'${nameWithOrWithoutPrefix}'` : nameWithOrWithoutPrefix;
          });
        })
        .join('\n  | ')
    );
  };
}
