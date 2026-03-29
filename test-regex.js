const code = `
export class FinacesRiskBadgeComponent {
    readonly riskClass = input<RiskClass>('MODERATE');
    readonly rail = input<Rail>('MCC');
    readonly size = input<'sm' | 'md'>('md');
    readonly showLabel = input<boolean>(true);
    readonly showIcon = input<boolean>(false);
    features = input<ShapFeature[]>([]);
    stats = input<DashboardStatsOut | null>(null);
    overrideDetails = input<ScoreOverride | undefined>();
}
`;
let transformed = code;
transformed = transformed.replace(/(?:readonly\s+|public\s+|private\s+|protected\s+)?([a-zA-Z0-9_$]+)\s*(?::\s*[^=]+)?\s*=\s*input(\s*<[^>]*>)?\s*\(/g, '@Input() $1 = input$2(');
console.log(transformed);
