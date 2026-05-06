import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  public currentWorkspace = signal<string>(localStorage.getItem('workspace_name') || 'Swift-SDR Startup');
  public workspaceLogo = signal<string | null>(localStorage.getItem('workspace_logo'));
  public userAvatar = signal<string | null>(localStorage.getItem('user_avatar'));
  public userName = signal<string>('Alan Rodrigues');
  public userRole = signal<string>('SDR Architect');

  constructor() {
    setInterval(() => {
      const wsName = localStorage.getItem('workspace_name');
      if (wsName && wsName !== this.currentWorkspace()) this.currentWorkspace.set(wsName);

      const logo = localStorage.getItem('workspace_logo');
      if (logo !== this.workspaceLogo()) this.workspaceLogo.set(logo);

      const avatar = localStorage.getItem('user_avatar');
      if (avatar !== this.userAvatar()) this.userAvatar.set(avatar);

      const profileRaw = localStorage.getItem('user_profile');
      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        if (profile.name !== this.userName()) this.userName.set(profile.name);
        if (profile.job_title !== this.userRole()) this.userRole.set(profile.job_title);
      }
    }, 1000);
  }
}
