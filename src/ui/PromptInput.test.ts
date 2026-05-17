import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptInput } from './PromptInput';
import { AppState } from '../state/AppState';

describe('PromptInput', () => {
  beforeEach(() => { document.body.innerHTML = '<div id="ui-layer"></div>'; });

  it('renders an input with aria-label', () => {
    const state = new AppState();
    new PromptInput(state, document.getElementById('ui-layer')!);
    const el = document.querySelector('input');
    expect(el).not.toBeNull();
    expect(el?.getAttribute('aria-label')).toBe('Prompt for the neural network');
    expect(el?.placeholder).toBe('Speak to the void...');
  });

  it('calls state.focus on focus', () => {
    const state = new AppState();
    const spy = vi.spyOn(state, 'focus');
    new PromptInput(state, document.getElementById('ui-layer')!);
    document.querySelector('input')!.dispatchEvent(new Event('focus'));
    expect(spy).toHaveBeenCalled();
  });

  it('calls state.type on input', () => {
    const state = new AppState();
    const spy = vi.spyOn(state, 'type');
    new PromptInput(state, document.getElementById('ui-layer')!);
    const el = document.querySelector('input') as HTMLInputElement;
    el.value = 'hello';
    el.dispatchEvent(new Event('input'));
    expect(spy).toHaveBeenCalledWith('hello');
  });

  it('hides during JOURNEY', () => {
    const state = new AppState();
    new PromptInput(state, document.getElementById('ui-layer')!);
    state.focus();
    state.submit('hello');
    const wrapper = document.querySelector('.prompt-wrapper') as HTMLElement;
    expect(getComputedStyle(wrapper).opacity).toBe('0');
    expect(getComputedStyle(wrapper).pointerEvents).toBe('none');
  });

  it('destroy removes the element', () => {
    const state = new AppState();
    const input = new PromptInput(state, document.getElementById('ui-layer')!);
    input.destroy();
    expect(document.querySelector('.prompt-wrapper')).toBeNull();
  });
});
