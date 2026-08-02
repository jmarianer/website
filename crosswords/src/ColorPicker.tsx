import { PALETTE, PaletteColor } from './identity';

type Props = {
  selected: PaletteColor;
  onSelect: (color: PaletteColor) => void;
}

export function ColorPicker({ selected, onSelect }: Props) {
  return (
    <div className='color-picker' role='radiogroup' aria-label='Your colour'>
      {PALETTE.map(color =>
        <button
          key={color.key}
          type='button'
          role='radio'
          aria-checked={color.key === selected.key}
          aria-label={color.name}
          title={color.name}
          data-testid={`color-${color.key}`}
          className={color.key === selected.key ? 'swatch selected' : 'swatch'}
          style={{ backgroundColor: color.hex }}
          onClick={() => onSelect(color)} />
      )}
    </div>
  );
}
