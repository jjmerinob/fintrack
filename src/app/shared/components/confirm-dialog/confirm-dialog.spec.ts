import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<ConfirmDialog>;
  const dialogRef = { close: vi.fn() };
  const data: ConfirmDialogData = {
    title: 'Delete transaction',
    message: 'This action cannot be undone.',
    confirmLabel: 'Delete',
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    await fixture.whenStable();
  });

  it('should render the title, message and custom confirm label', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Delete transaction');
    expect(text).toContain('This action cannot be undone.');
    expect(text).toContain('Delete');
  });

  it('should default the cancel label when none is provided', () => {
    expect(fixture.nativeElement.textContent).toContain('Cancel');
  });

  it('should close with true when confirmed', () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')];
    buttons.find((b: HTMLButtonElement) => b.textContent?.includes('Delete'))?.click();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close with false when cancelled', () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')];
    buttons.find((b: HTMLButtonElement) => b.textContent?.includes('Cancel'))?.click();

    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});
