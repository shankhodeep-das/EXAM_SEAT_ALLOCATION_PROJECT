import ComingSoon from "@/components/ComingSoon";

export default function DownloadPage() {
  return (
    <ComingSoon 
      title="Android and iOS App Assembly"
      subtitle="We are compiling the latest build of the SeatWise Android and iOS apps. Check back soon or leave your email for early access."
      noticeText="APK and IPA Builds v1.0.0-rc are currently in compilation & testing."
      // Once your APK is ready, uncomment the line below:
      // fileUrl="/downloads/seatwise.apk"
      // fileLabel="Download SeatWise APK"
    />
  );
}