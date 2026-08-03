import { PALETTE, PaletteColor } from './identity';

type Props = {
  open: boolean;
  onClose: () => void;
  color: PaletteColor;
  // Palette keys currently held by *other* people, so they can be shown as
  // spoken for. Still selectable: taking a colour someone else has is the
  // deliberate "this is also me, on my other device" gesture.
  taken: Set<string>;
  onSelectColor: (color: PaletteColor) => void;
  skipFilledCells: boolean;
  onSkipFilledCells: (on: boolean) => void;
  skipFinishedClues: boolean;
  onSkipFinishedClues: (on: boolean) => void;
  togetherMode: boolean;
  onTogetherMode: (on: boolean) => void;
  shareLabel: string;
  onShare: () => void;
  onEdit: () => void;
}

type ToggleProps = {
  checked: boolean;
  onChange: (on: boolean) => void;
  label: string;
  description: string;
}

// Module scope, not nested: a component declared inside another is a new type on
// every render and remounts its whole subtree.
function ToggleRow({ checked, onChange, label, description }: ToggleProps) {
  return (
    <button type='button' role='menuitemcheckbox' aria-checked={checked}
            className='toggle-row' onClick={() => onChange(!checked)}>
      <span className='switch'><span className='knob' /></span>
      <span>
        <span className='toggle-label'>{label}</span>
        <span className='toggle-description'>{description}</span>
      </span>
    </button>
  );
}

export function SettingsMenu(props: Props) {
  if (!props.open) {
    return null;
  }

  function act(action: () => void) {
    return () => {
      action();
      props.onClose();
    };
  }

  return (
    <div className='settings-menu' role='menu' aria-label='Puzzle settings'>
      <div className='menu-section'>
        <div className='section-label'>Solving</div>
        <div className='toggle-rows'>
          <ToggleRow
            checked={props.skipFilledCells} onChange={props.onSkipFilledCells}
            label='Skip filled cells'
            description='Typing jumps over letters already there' />
          <ToggleRow
            checked={props.skipFinishedClues} onChange={props.onSkipFinishedClues}
            label='Skip finished clues'
            description='Next-clue passes over answers that are full' />
        </div>
      </div>

      {/* Its own section rather than sitting with the two above: those are
          personal and local, while this one moves everybody's cursor. Placed
          after them and before the actions, following the menu's order of
          widening consequence. */}
      <div className='menu-section'>
        <div className='section-label'>Everyone</div>
        <div className='toggle-rows'>
          <ToggleRow
            checked={props.togetherMode} onChange={props.onTogetherMode}
            label='Together mode'
            description='Everyone shares one cursor and moves as a group' />
        </div>
      </div>

      <div className='menu-section'>
        <div className='section-label'>You</div>
        <div className='color-picker' role='radiogroup' aria-label='Your colour'>
          {PALETTE.map(entry => {
            const isTaken = props.taken.has(entry.key) && entry.key !== props.color.key;
            return (
              <button
                key={entry.key}
                type='button'
                role='radio'
                aria-checked={entry.key === props.color.key}
                aria-label={isTaken ? `${entry.name}, in use by someone else` : entry.name}
                title={entry.name}
                data-testid={`color-${entry.key}`}
                className={[
                  'swatch',
                  `color-${entry.key}`,
                  entry.key === props.color.key ? 'selected' : '',
                  isTaken ? 'taken' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => props.onSelectColor(entry)} />
            );
          })}
        </div>
        <div className='menu-note'>Faded colours are in use by someone else</div>
      </div>

      <div className='menu-actions'>
        <button type='button' role='menuitem' onClick={act(props.onShare)}>
          {props.shareLabel === 'Share' ? 'Share puzzle' : props.shareLabel}
        </button>
        <button type='button' role='menuitem' aria-haspopup='dialog' className='destructive'
                onClick={act(props.onEdit)}>
          Edit puzzle…
        </button>
      </div>
    </div>
  );
}
