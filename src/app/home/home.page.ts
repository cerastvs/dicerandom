import {
  Component,
  OnInit,
  OnDestroy,
  NgZone,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { Motion } from '@capacitor/motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { PluginListenerHandle } from '@capacitor/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
} from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonButton, IonHeader, IonToolbar, IonTitle, IonContent],
})
export class HomePage implements OnInit, OnDestroy {
  diceValue: number = 1;
  isRolling: boolean = false;
  private accelListener?: PluginListenerHandle;
  private readonly SHAKE_THRESHOLD = 5; // Binabaan ko ng kaunti dahil X-axis na lang
  private rollInterval: any;
  private stopTimeout: any;

  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  async ngOnInit() {
    await this.startShakeDetection();
  }

  async ngOnDestroy() {
    if (this.accelListener) {
      await this.accelListener.remove();
    }
  }

  private async startShakeDetection() {
    this.accelListener = await Motion.addListener('accel', async (event) => {
      this.ngZone.run(() => {
        const x =
          event.acceleration?.x || event.accelerationIncludingGravity?.x || 0;

        // Kanan at kaliwa (X-axis) lang ang sinusukat
        const magnitude = Math.abs(x);

        if (magnitude > this.SHAKE_THRESHOLD) {
          this.handleShake();
        }
      });
    });
  }

  private handleShake() {
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
    }

    if (!this.isRolling) {
      this.startRolling();
    }

    this.stopTimeout = setTimeout(() => {
      this.stopRolling();
    }, 500);
  }

  private async startRolling() {
    this.isRolling = true;
    this.cdr.detectChanges(); // Pilitin i-update ang "Rolling..." text

    await Haptics.impact({ style: ImpactStyle.Medium });

    this.rollInterval = setInterval(async () => {
      this.ngZone.run(() => {
        this.diceValue = Math.floor(Math.random() * 6) + 1;
        this.cdr.detectChanges(); // Pilitin i-update ang numero sa screen habang umiikot
      });
      await Haptics.impact({ style: ImpactStyle.Light });
    }, 100);
  }

  private async stopRolling() {
    if (!this.isRolling) return;

    clearInterval(this.rollInterval);

    this.ngZone.run(() => {
      this.diceValue = Math.floor(Math.random() * 6) + 1; // Pinal na numero
      this.isRolling = false;
      this.cdr.detectChanges(); // Pilitin i-update ang final na resulta sa screen
    });

    await Haptics.impact({ style: ImpactStyle.Heavy });
  }
}
