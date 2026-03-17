import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'currencyFormat',
    standalone: true,
})
export class CurrencyFormatPipe implements PipeTransform {
    transform(value: number, currency: string = 'USD', locale: string = 'en-US'): string {
        if (value === null || value === undefined) return '—';
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(value);
        } catch (e) {
            return `${value.toLocaleString(locale)} ${currency}`;
        }
    }
}