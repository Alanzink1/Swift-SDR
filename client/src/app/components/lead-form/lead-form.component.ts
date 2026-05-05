import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { LeadsService, LeadInsert } from '../../services/leads.service';

@Component({
  selector: 'app-lead-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lead-form.component.html',
  styleUrls: ['./lead-form.component.scss']
})
export class LeadFormComponent {
  private fb = inject(FormBuilder);
  private leadsService = inject(LeadsService);
  private dialogRef = inject(DialogRef);

  public leadForm: FormGroup;
  public isSaving = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);
  
  public stages = this.leadsService.stages;

  constructor() {
    this.leadForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      company: [''],
      job_title: [''],
      current_stage_id: ['', [Validators.required]],
      revenue: [0] // Campo personalizado sample
    });

    // Default stage
    if (this.stages().length > 0) {
      this.leadForm.patchValue({ current_stage_id: this.stages()[0].id });
    }
  }

  public close() {
    this.dialogRef.close();
  }

  public onSubmit() {
    if (this.leadForm.invalid) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { revenue, ...formData } = this.leadForm.value;
    
    const leadPayload: LeadInsert = {
      ...formData,
      custom_values: { revenue } // Mapeamento para campos personalizados (JSONB)
    };

    this.leadsService.createLead(leadPayload).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.leadsService.addLeadToSignal(data[0]);
          this.dialogRef.close(true);
        }
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Lead creation error:', err);
        this.errorMessage.set('Erro ao cadastrar lead. Verifique RLS ou campos.');
        this.isSaving.set(false);
      }
    });
  }
}
