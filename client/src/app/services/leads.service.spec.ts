import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LeadsService } from './leads.service';
import { environment } from '../../environments/environment';

describe('LeadsService', () => {
  let service: LeadsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LeadsService]
    });
    service = TestBed.inject(LeadsService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Ensure we are testing the production HTTP logic in some tests
    // For mock testing, we will alter the environment
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Mock Mode (development)', () => {
    beforeEach(() => {
      environment.production = false;
    });

    it('should generate message using mock and update signals', fakeAsync(() => {
      const leadId = '123e4567-e89b-12d3-a456-426614174000';
      const campaignId = '987e6543-e21b-34d5-c654-426614174999';

      expect(service.isGeneratingMessage()).toBeFalse();
      
      service.generateAiMessage(leadId, campaignId);
      
      expect(service.isGeneratingMessage()).toBeTrue();
      expect(service.currentLeadId()).toBe(leadId);
      
      // Simulate delay
      tick(1500);

      expect(service.isGeneratingMessage()).toBeFalse();
      expect(service.error()).toBeNull();
      
      const messages = service.messagesForCurrentLead();
      expect(messages.length).toBe(1);
      expect(messages[0].lead_id).toBe(leadId);
      expect(messages[0].content).toContain('(MOCK)');
    }));
  });

  describe('HTTP Mode (production)', () => {
    beforeEach(() => {
      environment.production = true;
    });

    it('should handle successful HTTP generation', () => {
      const leadId = 'lead-1';
      const campaignId = 'camp-1';

      service.generateAiMessage(leadId, campaignId);
      expect(service.isGeneratingMessage()).toBeTrue();

      const req = httpMock.expectOne(`${environment.supabaseUrl}/functions/v1/generate-message`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ leadId, campaignId });

      req.flush({
        data: {
          id: 'msg-1',
          lead_id: leadId,
          campaign_id: campaignId,
          content: 'Real message',
          is_sent: false,
          created_at: new Date().toISOString()
        }
      });

      expect(service.isGeneratingMessage()).toBeFalse();
      const messages = service.messagesForCurrentLead();
      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe('Real message');
    });

    it('should handle HTTP error generation', () => {
      const leadId = 'lead-2';
      const campaignId = 'camp-2';

      service.generateAiMessage(leadId, campaignId);

      const req = httpMock.expectOne(`${environment.supabaseUrl}/functions/v1/generate-message`);
      
      req.flush({ error: 'Supabase Error' }, { status: 400, statusText: 'Bad Request' });

      expect(service.isGeneratingMessage()).toBeFalse();
      expect(service.error()).toBe('Supabase Error');
    });
  });
});
