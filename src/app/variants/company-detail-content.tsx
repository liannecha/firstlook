import type { CompanyDetailSection } from "./company-details";
import "./company-detail-content.css";

export default function CompanyDetailContent({ section }: { section: CompanyDetailSection }) {
  return <div className="company-detail-content">
    {section.kind === "paragraph" ? <p>{section.text}</p> : section.kind === "bullets" ? <ul>
      {section.items.map(item => <li key={item.label ?? item.text}>{item.label ? <><strong>{item.label}:</strong> </> : null}{item.text}</li>)}
    </ul> : <dl>
      {section.fields.map(field => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}
    </dl>}
  </div>;
}
