"use client"

type CardProps = {
    title: string;
    value: string;
};

export default function Card ({title, value}:CardProps){
    return(
        <div className="flex flex-col border-2 border-[#EDEDED] rounded-xl
        text-black justify-center text-center shadow-lg">
            <h3>{title}</h3>
            <p>{value}</p>
        </div>
    );
}