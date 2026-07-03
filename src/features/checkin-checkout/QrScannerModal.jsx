import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Alert, Select } from 'antd';
import { Camera, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';
import { toast as message } from '../../components/ToastProvider';

const scanKeyframes = `
@keyframes qrLaserScan {
  0% { top: 10%; opacity: 0.3; }
  50% { opacity: 1; }
  100% { top: 90%; opacity: 0.3; }
}
.animate-qr-laser {
  animation: qrLaserScan 2s ease-in-out infinite;
}
`;

const QrScannerModal = ({ isOpen, onClose, onScanSuccess, title }) => {
  const { t } = useTranslation();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const qrScannerRef = useRef(null);
  const scannerContainerId = "local-qr-reader";
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Request cameras on open
  useEffect(() => {
    if (!isOpen) return;

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!isOpenRef.current) return;

        if (cameras && cameras.length > 0) {
          setDevices(cameras);
          // Auto select environment/back camera if available, otherwise first camera
          const backCamera = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('environment'));
          setSelectedDevice(backCamera ? backCamera.id : cameras[0].id);
        } else {
          message.error(t('gate.qrScanner.noCamera'));
        }
      })
      .catch((err) => {
        if (!isOpenRef.current) return;

        console.error("Error getting cameras", err);
        message.error(t('gate.qrScanner.noPermission'));
      });
  }, [isOpen]);

  // Handle start/stop scanner based on device selection and open state
  useEffect(() => {
    if (!isOpen || !selectedDevice) {
      stopScanner(false);
      return;
    }

    startScanner(selectedDevice);

    return () => {
      stopScanner(true);
    };
  }, [isOpen, selectedDevice]);

  const startScanner = (deviceId) => {
    // Stop any active scanner first
    stopScanner(false);

    // Small delay to ensure DOM element is ready
    setTimeout(() => {
      if (!isOpenRef.current) return;
      try {
        const html5QrCode = new Html5Qrcode(scannerContainerId);
        qrScannerRef.current = html5QrCode;
        setIsScanning(true);

        html5QrCode.start(
          deviceId,
          {
            fps: 15,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            }
          },
          (decodedText) => {
            message.success(t('gate.qrScanner.scanSuccess'));
            // Dừng camera trước rồi mới đóng modal và gọi callback
            stopScanner(false).finally(() => {
              onScanSuccess(decodedText);
              onClose();
            });
          },
          (errorMessage) => {
            // Constant scanning feedback, ignore
          }
        ).then(() => {
          // If the modal was closed while starting, stop it immediately
          if (!isOpenRef.current) {
            stopScanner(false);
          }
        }).catch((err) => {
          console.error("Failed to start QR scanner", err);
          if (isOpenRef.current) {
            setIsScanning(false);
          }
        });
      } catch (err) {
        console.error("QR scanner initialization error", err);
        if (isOpenRef.current) {
          setIsScanning(false);
        }
      }
    }, 100);
  };

  const stopScanner = (isUnmounting = false) => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        return qrScannerRef.current.stop()
          .then(() => {
            qrScannerRef.current = null;
            if (!isUnmounting) {
              setIsScanning(false);
            }
          })
          .catch((err) => {
            console.warn("Failed to stop QR scanner", err);
            qrScannerRef.current = null;
            if (!isUnmounting) {
              setIsScanning(false);
            }
          });
      } catch (err) {
        console.warn("Synchronous error stopping QR scanner", err);
        qrScannerRef.current = null;
        if (!isUnmounting) {
          setIsScanning(false);
        }
        return Promise.resolve();
      }
    }

    if (qrScannerRef.current) {
      qrScannerRef.current = null;
      if (!isUnmounting) {
        setIsScanning(false);
      }
    }

    return Promise.resolve();
  };

  const handleClose = () => {
    stopScanner(false).finally(() => {
      onClose();
    });
  };

  const handleDeviceChange = (value) => {
    setSelectedDevice(value);
  };

  return (
    <>
      <style>{scanKeyframes}</style>
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800 font-bold text-lg font-sans dark:text-slate-100">
            <Camera size={20} className="text-indigo-600" />
            {title}
          </div>
        }
        open={isOpen}
        onCancel={handleClose}
        footer={[
          <Button key="close" type="dashed" onClick={handleClose} className="font-bold h-10 px-5 rounded-[14px] border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-slate-100">
            {t('gate.qrScanner.close')}
          </Button>
        ]}
        width={450}
        centered
        destroyOnClose
      >
        <div className="space-y-4 pt-2">
          {devices.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">{t('gate.qrScanner.selectCamera')}</span>
              <Select
                value={selectedDevice}
                onChange={handleDeviceChange}
                className="flex-1"
                options={devices.map(device => ({ value: device.id, label: device.label }))}
              />
            </div>
          )}

          <div className="relative aspect-square w-full max-w-[320px] mx-auto bg-black rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center dark:border-slate-700">
            {/* HTML5 QrCode target element */}
            <div id={scannerContainerId} className="w-full h-full object-cover"></div>

            {/* Glowing scanning square overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* 4 Corner Markers */}
                <div className="relative w-48 h-48 border-2 border-dashed border-white/40 rounded-xl flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-indigo-500 rounded-tl-md"></div>
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-indigo-500 rounded-tr-md"></div>
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-indigo-500 rounded-bl-md"></div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-indigo-500 rounded-br-md"></div>

                  {/* Laser line anim */}
                  <div className="absolute left-2 right-2 h-0.5 bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-qr-laser"></div>
                </div>
              </div>
            )}

            {!isScanning && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="animate-spin text-indigo-400" size={28} />
                <span className="text-xs font-bold uppercase tracking-wider">{t('gate.qrScanner.initializing')}</span>
              </div>
            )}
          </div>

          <Alert
            message={t('gate.qrScanner.instructionTitle')}
            description={t('gate.qrScanner.instructionDesc')}
            type="info"
            showIcon
            className="rounded-xl text-xs"
          />
        </div>
      </Modal>
    </>
  );
};

export default QrScannerModal;
