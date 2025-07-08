const chartConfig = {
	type: 'pie',
	data: {
		labels: ['Completed', 'Pending'],
		datasets: [
			{
				data: [completed, pending],
				backgroundColor: ['#36A2EB', '#FF6384'],
				borderColor: ['#2E8BC0', '#D81E5B'],
				borderWidth: 1,
			},
		],
	},
	options: {
		responsive: true,
		plugins: {
			legend: { position: 'top' },
			title: { display: true, text: 'Task Status Distribution' },
		},
	},
};
