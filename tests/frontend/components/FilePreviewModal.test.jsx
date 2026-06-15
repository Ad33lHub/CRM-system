import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock sub-previewers and dependencies
vi.mock('@/hooks/useAuth', () => ({
  default: () => ({ accessToken: 'mock-token' }),
}));

vi.mock('@/services/filePreview.service', () => ({
  getFileCategory: (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'unknown';
    return 'unknown';
  },
  getPreviewStrategy: (mimeType) => {
    if (mimeType.startsWith('image/') || mimeType === 'application/pdf' || mimeType.startsWith('video/') || mimeType.startsWith('audio/')) return 'native';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'download_only';
    if (mimeType.includes('msword') || mimeType.includes('spreadsheet')) return 'google_viewer';
    return 'download_only';
  },
}));

vi.mock('@/components/FilePreview/ImagePreview', () => ({
  default: ({ url, name }) => <div data-testid="image-preview">ImagePreview: {name}</div>,
}));
vi.mock('@/components/FilePreview/PdfPreview', () => ({
  default: ({ url, name }) => <div data-testid="pdf-preview">PdfPreview: {name}</div>,
}));
vi.mock('@/components/FilePreview/VideoPreview', () => ({
  default: ({ url, name }) => <div data-testid="video-preview">VideoPreview: {name}</div>,
}));
vi.mock('@/components/FilePreview/AudioPreview', () => ({
  default: ({ url, name }) => <div data-testid="audio-preview">AudioPreview: {name}</div>,
}));
vi.mock('@/components/FilePreview/TextPreview', () => ({
  default: ({ url, name }) => <div data-testid="text-preview">TextPreview: {name}</div>,
}));
vi.mock('@/components/FilePreview/OfficePreview', () => ({
  default: ({ url, name }) => <div data-testid="office-preview">OfficePreview: {name}</div>,
}));
vi.mock('@/components/FilePreview/DownloadFallback', () => ({
  default: ({ url, name }) => <div data-testid="download-fallback">DownloadFallback: {name}</div>,
}));

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const MockIcon = ({ className, ...props }) => <span className={className} {...props}>icon</span>;
  return {
    X: MockIcon,
    Download: MockIcon,
    FileText: MockIcon,
    Music: MockIcon,
    File: MockIcon,
    Video: MockIcon,
    Image: MockIcon,
    Loader2: MockIcon,
    AlertCircle: MockIcon,
  };
});

import FilePreviewModal from '@/components/FilePreview/FilePreviewModal';

describe('FilePreviewModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for preview URL
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ signedUrl: 'https://example.com/file.pdf' }),
      })
    );
  });

  it('returns null when not open', () => {
    const { container } = render(
      <FilePreviewModal file={{ name: 'test.pdf', mimeType: 'application/pdf' }} open={false} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when no file', () => {
    const { container } = render(
      <FilePreviewModal file={null} open={true} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('opens correct viewer for PDF', async () => {
    render(
      <FilePreviewModal
        file={{ name: 'report.pdf', mimeType: 'application/pdf', url: 'https://example.com/report.pdf' }}
        open={true}
        onClose={mockOnClose}
      />
    );
    await waitFor(() => {
      expect(screen.getByTestId('pdf-preview')).toBeInTheDocument();
    });
  });

  it('opens correct viewer for image', async () => {
    render(
      <FilePreviewModal
        file={{ name: 'photo.jpg', mimeType: 'image/jpeg', url: 'https://example.com/photo.jpg' }}
        open={true}
        onClose={mockOnClose}
      />
    );
    await waitFor(() => {
      expect(screen.getByTestId('image-preview')).toBeInTheDocument();
    });
  });

  it('shows download fallback for ZIP', async () => {
    render(
      <FilePreviewModal
        file={{ name: 'archive.zip', mimeType: 'application/zip', url: 'https://example.com/archive.zip' }}
        open={true}
        onClose={mockOnClose}
      />
    );
    await waitFor(() => {
      expect(screen.getByTestId('download-fallback')).toBeInTheDocument();
    });
  });

  it('displays file name in header', async () => {
    render(
      <FilePreviewModal
        file={{ name: 'my-document.pdf', mimeType: 'application/pdf', url: 'https://example.com/doc.pdf' }}
        open={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('my-document.pdf')).toBeInTheDocument();
  });

  it('close button calls onClose', async () => {
    render(
      <FilePreviewModal
        file={{ name: 'test.pdf', mimeType: 'application/pdf', url: 'https://example.com/test.pdf' }}
        open={true}
        onClose={mockOnClose}
      />
    );
    // Find the close button (the X icon button in header)
    const closeButtons = screen.getAllByRole('button');
    const closeBtn = closeButtons.find(btn => {
      // The close button has onClick=onClose
      return btn.getAttribute('class')?.includes('text-slate-400') || true;
    });
    // Click the first non-download button
    fireEvent.click(closeButtons[0]);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
