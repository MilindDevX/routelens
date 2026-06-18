import type { RouteRecord, RouteParam } from '@/types';

type SnippetFormat = 'curl' | 'fetch' | 'axios';

function substitutePathParams(path: string, params: RouteParam[]): string {
  let result = path;
  const pathParams = params.filter((p) => p.in === 'path');
  for (const param of pathParams) {
    result = result.replace(
      new RegExp(`\\{${param.name}\\}`, 'g'),
      `<${param.name}>`
    );
  }
  return result;
}

function buildQueryString(params: RouteParam[]): string {
  const queryParams = params.filter((p) => p.in === 'query');
  if (!queryParams.length) return '';
  return '?' + queryParams.map((p) => `${p.name}=<${p.name}>`).join('&');
}

function buildExampleBody(params: RouteParam[]): string {
  const bodyParams = params.filter((p) => p.in === 'body' || p.in === 'formData');
  if (!bodyParams.length) return '{}';
  const obj: Record<string, string> = {};
  for (const p of bodyParams) {
    obj[p.name] = `<${p.name}>`;
  }
  return JSON.stringify(obj, null, 2);
}

function generateCurl(route: RouteRecord): string {
  const path = substitutePathParams(route.path, route.params);
  const qs = buildQueryString(route.params);
  const url = `https://api.example.com${path}${qs}`;
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(route.method);
  const bodyStr = hasBody ? buildExampleBody(route.params) : '';

  const headerFlags = ["-H 'Content-Type: application/json'", "-H 'Authorization: Bearer <token>'"];
  const bodyFlag = hasBody ? `\\\n  -d '${bodyStr}'` : '';

  return `curl -X ${route.method} '${url}' \\
  ${headerFlags.join(' \\\n  ')}${bodyFlag ? ' \\' : ''}${bodyFlag}`;
}

function generateFetch(route: RouteRecord): string {
  const path = substitutePathParams(route.path, route.params);
  const qs = buildQueryString(route.params);
  const url = `https://api.example.com${path}${qs}`;
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(route.method);
  const bodyStr = hasBody ? buildExampleBody(route.params) : null;

  return `const response = await fetch('${url}', {
  method: '${route.method}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>',
  },${hasBody ? `\n  body: JSON.stringify(${bodyStr}),` : ''}
});

const data = await response.json();
console.log(data);`;
}

function generateAxios(route: RouteRecord): string {
  const path = substitutePathParams(route.path, route.params);
  const qs = buildQueryString(route.params);
  const url = `https://api.example.com${path}${qs}`;
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(route.method);
  const bodyStr = hasBody ? buildExampleBody(route.params) : null;
  const methodLower = route.method.toLowerCase();

  if (hasBody) {
    return `const { data } = await axios.${methodLower}(
  '${url}',
  ${bodyStr},
  {
    headers: {
      Authorization: 'Bearer <token>',
    },
  }
);
console.log(data);`;
  }

  return `const { data } = await axios.${methodLower}('${url}', {
  headers: {
    Authorization: 'Bearer <token>',
  },
});
console.log(data);`;
}

export function generateSnippet(route: RouteRecord, format: SnippetFormat): string {
  switch (format) {
    case 'curl':
      return generateCurl(route);
    case 'fetch':
      return generateFetch(route);
    case 'axios':
      return generateAxios(route);
  }
}
