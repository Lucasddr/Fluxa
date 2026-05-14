
type ValueCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  textColor?: string;
  bgColor?: string;
  iconBgColor?: string;
};

export default function ValueCard({
    title,
    value,
    icon,
    textColor = "text-gray-900",
    bgColor = "bg-white",
    iconBgColor = "bg-gray-100",
        }: ValueCardProps) {

    return (
        <div className={`flex items-center justify-between p-4 rounded-xl shadow ${bgColor} shadow-lg border-2 border-(--color-border)`}>
        
        <div className="flex flex-col">
            <span className="text-sm text-gray-500">{title}</span>

            <span className={`text-lg font-semibold ${textColor}`}>
            {value}
            </span>
        </div>

        <div className={`p-2 rounded-lg ${iconBgColor}`}>
            {icon}
        </div>
        </div>
    );
}