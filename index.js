import { walk } from 'estree-walker';
import MagicString from 'magic-string';

// A set of known pawajs hook names that indicate a component context
const PAWA_HOOKS = new Set(['runEffect', 'useInsert', 'useRef', 'useValidateProps', '$state', 'useComponent', 'useProps', 'useContext', 'useInnerContext']);

/**
 * This function rewrites component return statements to be minifier-safe.
 * It transforms `runEffect(); return '...'` into:
 * `runEffect(); const _pawaTemplate = '...'; return _pawaTemplate;`
 */
function applyMinifierFix(functionNode, s) {
    const body = functionNode.body;
    // The body must be a block statement with at least two statements for the pattern to occur.
    if (body.type !== 'BlockStatement' || body.body.length < 2) {
        return false;
    }

    // Check if this function body contains any pawajs hooks at the top level.
    let containsPawaHook = false;
    for (const statement of body.body) {
        if (
            statement.type === 'ExpressionStatement' &&
            statement.expression.type === 'CallExpression' &&
            statement.expression.callee.type === 'Identifier' &&
            PAWA_HOOKS.has(statement.expression.callee.name)
        ) {
            containsPawaHook = true;
            break;
        }
        // Also check for hooks inside variable declarations, e.g., const state = $state(...)
        if (statement.type === 'VariableDeclaration') {
            for (const declarator of statement.declarations) {
                if (declarator.init && declarator.init.type === 'CallExpression' && declarator.init.callee.type === 'Identifier' && PAWA_HOOKS.has(declarator.init.callee.name)) {
                    containsPawaHook = true;
                    break;
                }
            }
            if (containsPawaHook) break;
        }
    }

    if (!containsPawaHook) {
        return false;
    }

    // If the last statement is `return ...;`, we apply the fix.
    const lastStatement = body.body[body.body.length - 1];
    if (lastStatement.type === 'ReturnStatement' && lastStatement.argument) {
        const returnArg = lastStatement.argument;
        const returnContent = s.slice(returnArg.start, returnArg.end);
        const varName = `_pawaTemplate`;

        // Overwrite the entire return statement with our safe version.
        s.overwrite(
            lastStatement.start,
            lastStatement.end,
            `const ${varName} = ${returnContent};\n  return ${varName};`
        );
        return true;
    }
    return false;
}

/**
 * This function transforms `RegisterComponent(MyButton)` into `RegisterComponent('MyButton', MyButton)`.
 */
function applyAutoName(node, s) {
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'RegisterComponent') {
        let modified = false;
        node.arguments.forEach(arg => {
            // Only transform simple identifiers to avoid breaking other patterns.
            if (arg.type === 'Identifier') {
                const componentName = arg.name;
                s.overwrite(arg.start, arg.end, `'${componentName}', ${componentName}`);
                modified = true;
            }
        });
        return modified;
    }
    return false;
}

export function pawajsPlugin() {
    return {
        name: 'vite-plugin-pawajs',
        enforce: 'pre',

        async transform(code, id) {
            if (!/\.(t|j)sx?$/.test(id) || id.includes('node_modules')) {
                return null;
            }

            const ast = this.parse(code);
            const s = new MagicString(code);
            let modified = false;

            walk(ast, {
                enter(node) {
                    // Apply auto-naming for component registration
                    if (applyAutoName(node, s)) {
                        modified = true;
                    }

                    // Apply the minifier return statement fix
                    if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
                        if (applyMinifierFix(node, s)) {
                            modified = true;
                            this.skip(); // Skip children of the transformed function
                        }
                    }
                }
            });

            if (!modified) {
                return null;
            }

            return {
                code: s.toString(),
                map: s.generateMap({ hires: true })
            };
        }
    };
}