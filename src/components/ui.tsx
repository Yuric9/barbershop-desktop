

export function Kpi({label,value}:{label:string;value:string}){return <div className="card kpi"><span>{label}</span><b>{value}</b></div>}

export function Metric({label,value}:{label:string;value:string}){return <div className="metric"><span>{label}</span><b>{value}</b></div>}
