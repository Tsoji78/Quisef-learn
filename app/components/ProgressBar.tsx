interface ProgressBarProps {
  step: number;
}

export default function ProgressBar({ step }: ProgressBarProps) {
  return (
    <div className="flex mb-8">
      {['Course Info', 'Modules', 'Details'].map((label, index) => (
        <div key={label} className="flex-1">
          <div
            className={`h-2 ${step >= index + 1 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'} ${
              index === 0 ? 'rounded-l-full' : index === 2 ? 'rounded-r-full' : ''
            }`}
          ></div>
          <p className={`text-center text-sm mt-2 ${step === index + 1 ? 'font-semibold text-blue-500' : 'text-gray-500'}`}>
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}