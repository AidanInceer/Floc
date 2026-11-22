export function siteSchema(base: string): string {
  const home = `${base}/`;
  const organizationId = `${home}#organization`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${home}#website`,
        name: "Floc",
        url: home,
        publisher: { "@id": organizationId },
      },
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Floc",
        url: home,
        logo: `${base}/floc-logo.png`,
      },
    ],
  };
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
